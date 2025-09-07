/**
 * Servicio principal de Stripe
 * Maneja operaciones de customers, suscripciones y pagos
 * Integrado con sistema fiscal español (IVA/IGIC)
 */

import { stripe } from '@/lib/stripe/client';
import { stripeConfig } from '@/lib/stripe/config';
import { determineTaxConfiguration, applyTaxToSubscription } from './taxService';
import type { 
  CreateSubscriptionData, 
  CreateSubscriptionResponse,
  CustomerTaxInfo 
} from '@/lib/stripe/types';
import type Stripe from 'stripe';

/**
 * Crea o recupera un customer de Stripe
 */
export async function createOrGetCustomer(data: {
  email: string;
  userId: string;
  name?: string;
  phone?: string;
  address?: Stripe.AddressParam;
}): Promise<{ success: boolean; customer?: Stripe.Customer; error?: string }> {
  try {
    // Buscar customer existente por email
    const existingCustomers = await stripe.customers.list({
      email: data.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      
      // Actualizar metadata con userId si no existe
      if (!customer.metadata?.clerk_user_id) {
        const updatedCustomer = await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            clerk_user_id: data.userId,
          },
        });
        return { success: true, customer: updatedCustomer };
      }
      
      return { success: true, customer };
    }

    // Crear nuevo customer
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      metadata: {
        clerk_user_id: data.userId,
        created_at: new Date().toISOString(),
      },
    });

    return { success: true, customer };

  } catch (error) {
    console.error('❌ Error creating/getting Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crea una nueva suscripción con configuración fiscal automática
 */
export async function createSubscription(
  data: CreateSubscriptionData
): Promise<CreateSubscriptionResponse> {
  try {
    // 1. Transformar dirección a formato Stripe
    const stripeAddress: Stripe.AddressParam = {
      country: data.billingAddress.country,
      postal_code: data.billingAddress.postalCode, // ✅ CORRECCIÓN: postalCode → postal_code
      city: data.billingAddress.city,
      line1: data.billingAddress.line1,
      line2: data.billingAddress.line2 || undefined,
      state: data.billingAddress.state || undefined,
    };

    // 2. Crear o recuperar customer
    const customerResult = await createOrGetCustomer({
      email: data.email,
      userId: data.userId,
      address: stripeAddress,
    });

    if (!customerResult.success || !customerResult.customer) {
      return {
        success: false,
        error: customerResult.error || 'Failed to create customer',
      };
    }

    const customer = customerResult.customer;

    // 3. Determinar configuración fiscal
    const taxInfo = determineTaxConfiguration({
      country: data.billingAddress.country,
      postalCode: data.billingAddress.postalCode,
    });

    // 4. Preparar datos de suscripción base
    let subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: [
        {
          price: data.priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        clerk_user_id: data.userId,
        billing_country: data.billingAddress.country,
        billing_postal_code: data.billingAddress.postalCode,
        tax_region: taxInfo.region,
        ...data.metadata,
      },
    };

    // 5. Aplicar configuración fiscal
    subscriptionData = await applyTaxToSubscription(subscriptionData, taxInfo);

    // 6. Crear suscripción
    const subscription = await stripe.subscriptions.create(subscriptionData);

    // 7. Extraer client_secret para el frontend
    let clientSecret: string | undefined;
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const paymentIntent = (subscription.latest_invoice as any).payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object') {
        clientSecret = (paymentIntent as any).client_secret || undefined;
      }
    }

    return {
      success: true,
      subscription: {
        ...subscription,
        taxInfo,
        billingCountry: data.billingAddress.country,
        effectiveTaxRate: taxInfo.taxConfig.rate,
      },
      clientSecret,
      taxInfo,
    };

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Actualiza una suscripción existente
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Stripe.SubscriptionUpdateParams>
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      ...updates,
      metadata: {
        ...updates.metadata,
        updated_at: new Date().toISOString(),
      },
    });

    return { success: true, subscription };

  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<{ success: boolean; subscription?: Stripe.Subscription; error?: string }> {
  try {
    let subscription: Stripe.Subscription;

    if (cancelAtPeriodEnd) {
      // Cancelar al final del período actual
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: 'true',
        },
      });
    } else {
      // Cancelar inmediatamente
      subscription = await stripe.subscriptions.cancel(subscriptionId, {
        prorate: true,
      });
    }

    return { success: true, subscription };

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crea una sesión del portal de facturación de Stripe
 */
export async function createPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${stripeConfig.urls.portal}`,
    });

    return {
      success: true,
      url: portalSession.url,
    };

  } catch (error) {
    console.error('❌ Error creating portal session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Obtiene información detallada de una suscripción
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<{ success: boolean; subscription?: Stripe.Subscription; taxInfo?: CustomerTaxInfo; error?: string }> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'latest_invoice', 'default_payment_method'],
    });

    // Obtener información fiscal si el customer tiene dirección
    let taxInfo: CustomerTaxInfo | undefined;
    if (subscription.customer && typeof subscription.customer === 'object') {
      const customer = subscription.customer as Stripe.Customer;
      if (customer.address?.country) {
        taxInfo = determineTaxConfiguration({
          country: customer.address.country,
          postalCode: customer.address.postal_code || undefined,
        });
      }
    }

    return {
      success: true,
      subscription,
      taxInfo,
    };

  } catch (error) {
    console.error('❌ Error getting subscription details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Lista todas las suscripciones de un customer
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<{ success: boolean; subscriptions?: Stripe.Subscription[]; error?: string }> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    return {
      success: true,
      subscriptions: subscriptions.data,
    };

  } catch (error) {
    console.error('❌ Error getting customer subscriptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Obtiene el customer de Stripe por email o userId de Clerk
 */
export async function getCustomerByClerkUserId(
  clerkUserId: string
): Promise<{ success: boolean; customer?: Stripe.Customer; error?: string }> {
  try {
    const customers = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${clerkUserId}'`,
    });

    if (customers.data.length === 0) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    return {
      success: true,
      customer: customers.data[0],
    };

  } catch (error) {
    console.error('❌ Error finding customer by Clerk user ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sincroniza los precios de Stripe con información fiscal
 */
export async function getPricesWithTaxInfo(): Promise<{
  success: boolean;
  prices?: Array<Stripe.Price & { taxInfo?: any }>;
  error?: string;
}> {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Agregar información de ejemplo de impuestos para cada precio
    const pricesWithTax = prices.data.map(price => ({
      ...price,
      taxInfo: {
        spainVAT: {
          rate: 0.21,
          description: 'IVA España Continental (21%)',
        },
        canaryIGIC: {
          rate: 0.07,
          description: 'IGIC Islas Canarias (7%)',
        },
      },
    }));

    return {
      success: true,
      prices: pricesWithTax,
    };

  } catch (error) {
    console.error('❌ Error getting prices with tax info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}