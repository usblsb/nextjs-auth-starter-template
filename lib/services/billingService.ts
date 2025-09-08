/**
 * Servicio de facturación y sincronización BD
 * Integra Stripe con base de datos PostgreSQL [DB1]
 * Maneja suscripciones, pagos y logs de actividad
 */

import { PrismaClient } from '@prisma/client';
import { 
  createSubscription as createStripeSubscription,
  updateSubscription as updateStripeSubscription,
  cancelSubscription as cancelStripeSubscription,
  getCustomerByClerkUserId,
  createOrGetCustomer,
  getSubscriptionDetails
} from './stripeService';
import { determineTaxConfiguration } from './taxService';
import type { 
  CreateSubscriptionData, 
  UserSubscriptionStatus,
  BillingPlan 
} from '@/lib/stripe/types';
import type { UserProfile, UserSubscription, UserBillingAddress } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene el estado de suscripción actual del usuario
 */
export async function getUserSubscriptionStatus(
  clerkUserId: string
): Promise<UserSubscriptionStatus> {
  try {
    // Buscar suscripción activa en BD
    const userWithSubscription = await prisma.userProfile.findUnique({
      where: { clerkUserId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing', 'past_due']
            }
          },
          include: {
            billingPlan: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!userWithSubscription || userWithSubscription.subscriptions.length === 0) {
      console.log(`ℹ️ [SUBSCRIPTION-STATUS] User ${clerkUserId} has no active subscriptions`);
      console.log(`🔍 [SUBSCRIPTION-STATUS] UserProfile:`, {
        found: !!userWithSubscription,
        subscriptionsCount: userWithSubscription?.subscriptions?.length || 0
      });
      return {
        isSubscribed: false,
        accessLevel: 'FREE',
      };
    }

    const subscription = userWithSubscription.subscriptions[0];
    const plan = subscription.billingPlan;

    console.log(`✅ [SUBSCRIPTION-STATUS] User ${clerkUserId} has active subscription:`, {
      id: subscription.stripeSubscriptionId,
      status: subscription.status,
      planName: plan?.name,
      features: subscription.features,
    });

    return {
      isSubscribed: true,
      status: subscription.status as any,
      currentPlan: {
        id: plan?.planKey || 'unknown',
        name: plan?.name || 'Unknown Plan',
        description: plan?.description || undefined,
        stripePriceId: plan?.stripePriceId || '',
        stripeProductId: plan?.stripeProductId || '',
        price: Number(plan?.price || 0),
        currency: plan?.currency || 'EUR',
        interval: (plan?.interval as 'month' | 'year') || 'month',
        features: subscription.features || ['PREMIUM'],
        isActive: plan?.isActive ?? true,
      },
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.status === 'active' && subscription.currentPeriodEnd < new Date(),
      accessLevel: 'PREMIUM',
    };

  } catch (error) {
    console.error('❌ Error getting user subscription status:', error);
    return {
      isSubscribed: false,
      accessLevel: 'FREE',
    };
  }
}

/**
 * Crea una nueva suscripción y la sincroniza con BD
 */
export async function createUserSubscription(
  clerkUserId: string,
  subscriptionData: CreateSubscriptionData
): Promise<{ success: boolean; subscriptionId?: string; clientSecret?: string; error?: string }> {
  try {
    // 1. Verificar que el usuario existe en BD
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId }
    });

    if (!userProfile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    // 2. Crear suscripción en Stripe
    const stripeResult = await createStripeSubscription(subscriptionData);

    if (!stripeResult.success || !stripeResult.subscription) {
      return {
        success: false,
        error: stripeResult.error || 'Failed to create Stripe subscription',
      };
    }

    const { subscription, taxInfo } = stripeResult;

    // 3. Guardar dirección de facturación
    if (subscriptionData.billingAddress) {
      await upsertBillingAddress(clerkUserId, subscriptionData.billingAddress);
    }

    // 4. Sincronizar suscripción con BD
    const syncResult = await syncSubscriptionToDB(subscription, clerkUserId);

    if (!syncResult.success) {
      console.error('⚠️ Subscription created in Stripe but failed to sync to DB:', syncResult.error);
    }

    // 5. Log de actividad
    await logBillingActivity(clerkUserId, 'SUBSCRIPTION_CREATED', {
      subscriptionId: subscription.id,
      priceId: subscriptionData.priceId,
      taxInfo: taxInfo,
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: stripeResult.clientSecret,
    };

  } catch (error) {
    console.error('❌ Error creating user subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sincroniza una suscripción de Stripe con la base de datos
 */
export async function syncSubscriptionToDB(
  stripeSubscription: any,
  clerkUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = typeof stripeSubscription.customer === 'string' 
      ? stripeSubscription.customer 
      : stripeSubscription.customer?.id;

    if (!customerId) {
      return { success: false, error: 'No customer ID found' };
    }

    // Extraer información de la suscripción
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    if (!priceId) {
      return { success: false, error: 'No price ID found' };
    }

    // Buscar el plan de facturación correspondiente
    const billingPlan = await prisma.userBillingPlan.findUnique({
      where: { stripePriceId: priceId }
    });

    if (!billingPlan) {
      console.warn(`⚠️ Billing plan not found for price ID: ${priceId}`);
      // Continuamos sin fallar - puede que el plan se agregue después
    }

    // Obtener fechas del subscription item (más confiable que top-level)
    const subscriptionItem = stripeSubscription.items?.data?.[0];
    const periodStart = stripeSubscription.current_period_start || subscriptionItem?.current_period_start;
    const periodEnd = stripeSubscription.current_period_end || subscriptionItem?.current_period_end;
    
    console.log('🗓️ Subscription period data:', {
      periodStart,
      periodEnd,
      status: stripeSubscription.status,
      subscriptionId: stripeSubscription.id,
      created: stripeSubscription.created,
      hasTopLevelDates: {
        current_period_start: !!stripeSubscription.current_period_start,
        current_period_end: !!stripeSubscription.current_period_end
      },
      hasItemDates: {
        current_period_start: !!subscriptionItem?.current_period_start,
        current_period_end: !!subscriptionItem?.current_period_end
      }
    });
    
    if (!periodStart || !periodEnd) {
      console.error('❌ Invalid period dates from Stripe:', { 
        periodStart, 
        periodEnd,
        subscriptionObject: JSON.stringify(stripeSubscription, null, 2)
      });
      throw new Error('Invalid period dates from Stripe subscription');
    }

    // Crear o actualizar suscripción en BD
    const subscriptionData = {
      userId: clerkUserId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      interval: stripeSubscription.items.data[0]?.price?.recurring?.interval || 'month',
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      features: (billingPlan?.meta as any)?.features || ['PREMIUM'],
      raw: stripeSubscription,
    };

    await prisma.userSubscription.upsert({
      where: { stripeSubscriptionId: stripeSubscription.id },
      create: subscriptionData,
      update: subscriptionData,
    });

    return { success: true };

  } catch (error) {
    console.error('❌ Error syncing subscription to DB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancela una suscripción y actualiza BD
 */
export async function cancelUserSubscription(
  clerkUserId: string,
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Cancelar en Stripe
    const cancelResult = await cancelStripeSubscription(subscriptionId, cancelAtPeriodEnd);

    if (!cancelResult.success || !cancelResult.subscription) {
      return {
        success: false,
        error: cancelResult.error || 'Failed to cancel Stripe subscription',
      };
    }

    // 2. Actualizar en BD
    const syncResult = await syncSubscriptionToDB(cancelResult.subscription, clerkUserId);

    // 3. Log de actividad
    await logBillingActivity(clerkUserId, 'SUBSCRIPTION_CANCELLED', {
      subscriptionId,
      cancelAtPeriodEnd,
      effectiveDate: cancelAtPeriodEnd 
        ? (cancelResult.subscription as any).current_period_end 
        : new Date(),
    });

    return { success: true };

  } catch (error) {
    console.error('❌ Error cancelling user subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Guarda o actualiza dirección de facturación
 */
export async function upsertBillingAddress(
  clerkUserId: string,
  address: {
    country: string;
    postalCode: string;
    city: string;
    line1: string;
    line2?: string;
    state?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullAddress = `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.postalCode}, ${address.country}`;

    const existingAddress = await prisma.userBillingAddress.findFirst({
      where: { userId: clerkUserId }
    });

    if (existingAddress) {
      await prisma.userBillingAddress.update({
        where: { id: existingAddress.id },
        data: {
          country: address.country,
          state: address.state,
          city: address.city,
          postalCode: address.postalCode,
          addressLine1: address.line1,
          addressLine2: address.line2,
          fullAddress,
          updatedAt: new Date(),
        }
      });
    } else {
      await prisma.userBillingAddress.create({
        data: {
          userId: clerkUserId,
          country: address.country,
          state: address.state,
          city: address.city,
          postalCode: address.postalCode,
          addressLine1: address.line1,
          addressLine2: address.line2,
          fullAddress,
        }
      });
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error upserting billing address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Obtiene la dirección de facturación del usuario
 */
export async function getUserBillingAddress(
  clerkUserId: string
): Promise<UserBillingAddress | null> {
  try {
    return await prisma.userBillingAddress.findFirst({
      where: { userId: clerkUserId }
    });
  } catch (error) {
    console.error('❌ Error getting user billing address:', error);
    return null;
  }
}

/**
 * Registra actividad de facturación en los logs
 */
export async function logBillingActivity(
  clerkUserId: string,
  action: string,
  metadata: any,
  description?: string
): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: clerkUserId,
        clerkUserId: clerkUserId,
        action: `BILLING_${action}`,
        description: description || `Billing action: ${action}`,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          service: 'stripe',
        },
        resourceType: 'billing',
        resourceId: metadata.subscriptionId || metadata.customerId,
      },
    });
  } catch (error) {
    console.error('❌ Error logging billing activity:', error);
    // No lanzamos error para que no interrumpa el flujo principal
  }
}

/**
 * Obtiene todos los planes de facturación disponibles
 */
export async function getAvailablePlans(): Promise<BillingPlan[]> {
  try {
    const plans = await prisma.userBillingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return plans.map(plan => ({
      id: plan.planKey,
      name: plan.name,
      description: plan.description || undefined,
      stripePriceId: plan.stripePriceId,
      stripeProductId: plan.stripeProductId,
      price: Number(plan.price),
      currency: plan.currency,
      interval: plan.interval as 'month' | 'year',
      features: (plan.meta as any)?.features || [],
      isActive: plan.isActive,
    }));

  } catch (error) {
    console.error('❌ Error getting available plans:', error);
    return [];
  }
}

/**
 * Sincronizar usuario con customer de Stripe existente
 */
export async function linkUserToStripeCustomer(
  clerkUserId: string,
  email: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const customerResult = await createOrGetCustomer({
      email,
      userId: clerkUserId,
    });

    if (!customerResult.success || !customerResult.customer) {
      return {
        success: false,
        error: customerResult.error || 'Failed to create/get customer',
      };
    }

    await logBillingActivity(clerkUserId, 'CUSTOMER_LINKED', {
      customerId: customerResult.customer.id,
      email,
    }, `Linked to Stripe customer ${customerResult.customer.id}`);

    return {
      success: true,
      customerId: customerResult.customer.id,
    };

  } catch (error) {
    console.error('❌ Error linking user to Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}