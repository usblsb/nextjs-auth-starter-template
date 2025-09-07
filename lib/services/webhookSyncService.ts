/**
 * Servicio de sincronización para webhooks
 * Maneja la sincronización bidireccional entre Stripe y BD
 * Incluye deduplicación y manejo de errores
 */

import { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { logBillingActivity } from './billingService';

const prisma = new PrismaClient();

/**
 * Tabla para trackear eventos procesados (evitar duplicados)
 */
interface ProcessedWebhookEvent {
  stripeEventId: string;
  eventType: string;
  processedAt: Date;
  success: boolean;
  error?: string;
  metadata?: any;
}

/**
 * Verifica si un evento ya fue procesado
 */
export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  try {
    const existing = await prisma.userActivityLog.findFirst({
      where: {
        AND: [
          { action: { contains: 'WEBHOOK' } },
          { metadata: { path: ['stripeEventId'], equals: stripeEventId } }
        ]
      }
    });

    return !!existing;
  } catch (error) {
    console.error('❌ Error checking if event is processed:', error);
    return false; // En caso de error, procesar el evento
  }
}

/**
 * Marca un evento como procesado
 */
export async function markEventAsProcessed(
  stripeEventId: string,
  eventType: string,
  success: boolean,
  clerkUserId?: string,
  error?: string,
  metadata?: any
): Promise<void> {
  try {
    if (clerkUserId) {
      await logBillingActivity(clerkUserId, 'WEBHOOK_PROCESSED', {
        stripeEventId,
        eventType,
        success,
        error,
        processedAt: new Date().toISOString(),
        ...metadata,
      }, `Webhook ${eventType} ${success ? 'processed successfully' : 'failed'}`);
    }
  } catch (error) {
    console.error('❌ Error marking event as processed:', error);
  }
}

/**
 * Sincroniza customer de Stripe con UserProfile
 */
export async function syncStripeCustomerToDB(
  customer: Stripe.Customer,
  clerkUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (customer.deleted) {
      return { success: false, error: 'Customer is deleted' };
    }

    const userId = clerkUserId || customer.metadata?.clerk_user_id;
    
    if (!userId) {
      return { success: false, error: 'No clerk_user_id found' };
    }

    // Verificar que el usuario existe
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId }
    });

    if (!userProfile) {
      console.warn(`⚠️ User profile not found for clerk_user_id: ${userId}`);
      return { success: false, error: 'User profile not found' };
    }

    // Actualizar o crear información adicional si es necesario
    // Por ahora solo logeamos, pero podríamos sincronizar datos adicionales
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error syncing Stripe customer to DB:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Busca el clerkUserId asociado a un customer de Stripe
 */
export async function findClerkUserIdFromStripeCustomer(
  customerId: string
): Promise<string | null> {
  try {
    // Buscar en suscripciones existentes
    const subscription = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      select: { userId: true },
    });

    if (subscription) {
      return subscription.userId;
    }

    // Si no se encuentra, buscar en logs de actividad
    const activityLog = await prisma.userActivityLog.findFirst({
      where: {
        AND: [
          { action: { contains: 'BILLING' } },
          { metadata: { path: ['customerId'], equals: customerId } }
        ]
      },
      select: { clerkUserId: true },
      orderBy: { createdAt: 'desc' },
    });

    return activityLog?.clerkUserId || null;

  } catch (error) {
    console.error('❌ Error finding clerk user ID from Stripe customer:', error);
    return null;
  }
}

/**
 * Valida la coherencia de datos entre Stripe y BD
 */
export async function validateDataConsistency(
  subscriptionId: string
): Promise<{
  consistent: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // 1. Verificar suscripción en BD
    const dbSubscription = await prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { billingPlan: true, userProfile: true },
    });

    if (!dbSubscription) {
      issues.push('Subscription not found in database');
      recommendations.push('Sync subscription from Stripe to database');
      return { consistent: false, issues, recommendations };
    }

    // 2. Verificar suscripción en Stripe
    const { stripe } = await import('@/lib/stripe/client');
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // 3. Comparar estados
    if (dbSubscription.status !== stripeSubscription.status) {
      issues.push(`Status mismatch: DB=${dbSubscription.status}, Stripe=${stripeSubscription.status}`);
      recommendations.push('Update database status to match Stripe');
    }

    const stripePriceId = stripeSubscription.items.data[0]?.price?.id;
    if (dbSubscription.stripePriceId !== stripePriceId) {
      issues.push(`Price ID mismatch: DB=${dbSubscription.stripePriceId}, Stripe=${stripePriceId}`);
      recommendations.push('Update database price ID to match Stripe');
    }

    // 4. Verificar fechas
    const dbPeriodEnd = dbSubscription.currentPeriodEnd.getTime() / 1000;
    const stripePeriodEnd = (stripeSubscription as any).current_period_end;
    
    if (Math.abs(dbPeriodEnd - stripePeriodEnd) > 60) { // Tolerancia de 1 minuto
      issues.push('Period end date mismatch');
      recommendations.push('Update database period dates to match Stripe');
    }

    return {
      consistent: issues.length === 0,
      issues,
      recommendations,
    };

  } catch (error) {
    issues.push(`Validation error: ${String(error)}`);
    recommendations.push('Check network connection and Stripe API access');
    
    return { consistent: false, issues, recommendations };
  }
}

/**
 * Repara inconsistencias detectadas
 */
export async function repairDataInconsistency(
  subscriptionId: string
): Promise<{ success: boolean; repaired: string[]; errors: string[] }> {
  const repaired: string[] = [];
  const errors: string[] = [];

  try {
    const validation = await validateDataConsistency(subscriptionId);
    
    if (validation.consistent) {
      return { success: true, repaired: ['No repairs needed'], errors: [] };
    }

    // Obtener datos actuales de Stripe
    const { stripe } = await import('@/lib/stripe/client');
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Reparar en BD
    const updated = await prisma.userSubscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: stripeSubscription.status,
        stripePriceId: stripeSubscription.items.data[0]?.price?.id || '',
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        raw: stripeSubscription as any,
        updatedAt: new Date(),
      },
    });

    repaired.push(`Updated subscription ${subscriptionId} with Stripe data`);

    // Log de la reparación
    await logBillingActivity(updated.userId, 'DATA_REPAIR', {
      subscriptionId,
      repairedFields: validation.issues,
      repairedAt: new Date().toISOString(),
    }, 'Automatic data repair from Stripe webhook validation');

    return { success: true, repaired, errors };

  } catch (error) {
    errors.push(String(error));
    return { success: false, repaired, errors };
  }
}

/**
 * Obtiene estadísticas de webhooks procesados
 */
export async function getWebhookStats(days: number = 7): Promise<{
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  eventTypes: Record<string, number>;
  recentFailures: any[];
}> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const webhookLogs = await prisma.userActivityLog.findMany({
      where: {
        AND: [
          { action: { contains: 'WEBHOOK' } },
          { createdAt: { gte: since } }
        ]
      },
      select: {
        action: true,
        metadata: true,
        createdAt: true,
      },
    });

    const stats = webhookLogs.reduce((acc, log) => {
      const eventType = (log.metadata as any)?.eventType || 'unknown';
      const success = !(log.metadata as any)?.error;

      acc.totalEvents++;
      
      if (success) {
        acc.successfulEvents++;
      } else {
        acc.failedEvents++;
        acc.recentFailures.push({
          eventType,
          error: (log.metadata as any)?.error,
          createdAt: log.createdAt,
        });
      }

      acc.eventTypes[eventType] = (acc.eventTypes[eventType] || 0) + 1;

      return acc;
    }, {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventTypes: {} as Record<string, number>,
      recentFailures: [] as any[],
    });

    return stats;

  } catch (error) {
    console.error('❌ Error getting webhook stats:', error);
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventTypes: {},
      recentFailures: [],
    };
  }
}