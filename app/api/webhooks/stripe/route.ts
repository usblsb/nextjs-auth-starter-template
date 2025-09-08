/**
 * Webhook Endpoint: Eventos de Stripe
 * POST /api/webhooks/stripe
 * 
 * Procesa eventos críticos de Stripe:
 * - Suscripciones: created, updated, deleted
 * - Pagos: succeeded, failed
 * - Customers: created, updated, deleted
 * 
 * Sincroniza automáticamente con BD [DB1]
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { syncSubscriptionToDB, logBillingActivity } from '@/lib/services/billingService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Eventos críticos que procesamos
const CRITICAL_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'customer.deleted',
] as const;

type StripeWebhookEvent = typeof CRITICAL_EVENTS[number];

/**
 * Valida la firma del webhook de Stripe
 */
function validateWebhookSignature(payload: string, signature: string): Stripe.Event | null {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return null;
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Error validating Stripe webhook signature:', err);
    return null;
  }
}

/**
 * Procesa evento checkout.session.completed
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  if (DEBUG_MODE) {
    console.log('🛒 Checkout session completed:', {
      id: session.id,
      customer: session.customer,
      subscription: session.subscription,
      amountTotal: session.amount_total,
    });
  }

  const clerkUserId = session.client_reference_id;
  
  if (!clerkUserId) {
    console.error('❌ No client_reference_id in checkout session');
    return { success: false, error: 'No client_reference_id found' };
  }

  // Log del checkout completado
  await logBillingActivity(clerkUserId, 'CHECKOUT_SESSION_COMPLETED', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    amountTotal: session.amount_total,
    currency: session.currency,
    stripeEventId: event.id,
  }, 'Checkout session completed via webhook');

  // Si hay suscripción, obtener detalles y sincronizar
  if (session.subscription && typeof session.subscription === 'string') {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const syncResult = await syncSubscriptionToDB(subscription, clerkUserId);
      
      if (syncResult.success && DEBUG_MODE) {
        console.log('✅ Subscription synced from checkout session:', subscription.id);
      }
      
      return syncResult;
    } catch (error) {
      console.error('❌ Error syncing subscription from checkout session:', error);
      return { success: false, error: String(error) };
    }
  }

  return { success: true };
}

/**
 * Procesa evento customer.subscription.created
 */
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  if (DEBUG_MODE) {
    console.log('🆕 Subscription created:', {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price?.id,
    });
  }

  // Buscar userId por customer metadata
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('❌ Customer deleted, cannot sync subscription');
    return { success: false, error: 'Customer deleted' };
  }

  const clerkUserId = customer.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('❌ No clerk_user_id in customer metadata');
    return { success: false, error: 'No clerk_user_id found' };
  }

  // Sincronizar con BD
  const syncResult = await syncSubscriptionToDB(subscription, clerkUserId);
  
  // Log de actividad
  await logBillingActivity(clerkUserId, 'SUBSCRIPTION_WEBHOOK_CREATED', {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    stripeEventId: event.id,
  }, 'Subscription created via Stripe webhook');

  return syncResult;
}

/**
 * Procesa evento customer.subscription.updated
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  if (DEBUG_MODE) {
    console.log('📝 Subscription updated:', {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  // Buscar userId por customer
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('❌ Customer deleted, cannot sync subscription update');
    return { success: false, error: 'Customer deleted' };
  }

  const clerkUserId = customer.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('❌ No clerk_user_id in customer metadata');
    return { success: false, error: 'No clerk_user_id found' };
  }

  // Sincronizar con BD
  const syncResult = await syncSubscriptionToDB(subscription, clerkUserId);
  
  // Log de actividad con detalles del cambio
  const previousAttributes = (event.data.previous_attributes as any) || {};
  
  await logBillingActivity(clerkUserId, 'SUBSCRIPTION_WEBHOOK_UPDATED', {
    subscriptionId: subscription.id,
    customerId,
    currentStatus: subscription.status,
    changes: previousAttributes,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeEventId: event.id,
  }, 'Subscription updated via Stripe webhook');

  return syncResult;
}

/**
 * Procesa evento customer.subscription.deleted
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  if (DEBUG_MODE) {
    console.log('🗑️ Subscription deleted:', {
      id: subscription.id,
      customer: subscription.customer,
    });
  }

  try {
    // Actualizar estado en BD
    await prisma.userSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        raw: JSON.parse(JSON.stringify(subscription)) as any,
        updatedAt: new Date(),
      },
    });

    // Log de actividad - buscar userId desde BD
    const userSubscription = await prisma.userSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { userId: true },
    });

    if (userSubscription) {
      await logBillingActivity(userSubscription.userId, 'SUBSCRIPTION_WEBHOOK_DELETED', {
        subscriptionId: subscription.id,
        deletedAt: new Date(event.created * 1000),
        stripeEventId: event.id,
      }, 'Subscription deleted via Stripe webhook');
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Procesa evento invoice.payment_succeeded
 */
async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  if (DEBUG_MODE) {
    console.log('💳 Payment succeeded:', {
      id: invoice.id,
      customer: invoice.customer,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
  }

  // Buscar userId por customer
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) {
    return { success: false, error: 'No customer ID found' };
  }

  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    return { success: false, error: 'Customer deleted' };
  }

  const clerkUserId = customer.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    return { success: false, error: 'No clerk_user_id found' };
  }

  // Log de pago exitoso
  await logBillingActivity(clerkUserId, 'PAYMENT_SUCCEEDED', {
    invoiceId: invoice.id,
    subscriptionId: (invoice as any).subscription,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    stripeEventId: event.id,
  }, `Payment of ${invoice.amount_paid/100} ${invoice.currency.toUpperCase()} succeeded`);

  return { success: true };
}

/**
 * Procesa evento invoice.payment_failed
 */
async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  if (DEBUG_MODE) {
    console.log('❌ Payment failed:', {
      id: invoice.id,
      customer: invoice.customer,
      amount: invoice.amount_due,
      attemptCount: invoice.attempt_count,
    });
  }

  // Similar lógica que payment_succeeded pero para fallos
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) {
    return { success: false, error: 'No customer ID found' };
  }

  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    return { success: false, error: 'Customer deleted' };
  }

  const clerkUserId = customer.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    return { success: false, error: 'No clerk_user_id found' };
  }

  // Log de pago fallido
  await logBillingActivity(clerkUserId, 'PAYMENT_FAILED', {
    invoiceId: invoice.id,
    subscriptionId: (invoice as any).subscription,
    amount: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt,
    stripeEventId: event.id,
  }, `Payment of ${invoice.amount_due/100} ${invoice.currency.toUpperCase()} failed (attempt ${invoice.attempt_count})`);

  return { success: true };
}

/**
 * Guarda la dirección de billing desde Stripe a la BD
 * SIEMPRE crea una nueva entrada para mantener historial completo (compliance legal España)
 */
async function saveBillingAddressFromStripe(
  clerkUserId: string,
  stripeAddress: Stripe.Address,
  customerName: { firstName?: string; lastName?: string } | null,
  eventId: string
): Promise<void> {
  if (!stripeAddress) return;

  try {
    // Crear dirección completa
    const fullAddress = [
      stripeAddress.line1,
      stripeAddress.line2,
      stripeAddress.city,
      stripeAddress.postal_code,
      stripeAddress.state,
      stripeAddress.country
    ].filter(Boolean).join(', ');

    // SIEMPRE crear nueva entrada - NO actualizar existente
    // Esto mantiene el historial completo para compliance legal
    const newAddressEntry = await prisma.userBillingAddress.create({
      data: {
        userId: clerkUserId,
        firstName: customerName?.firstName || null,
        lastName: customerName?.lastName || null,
        country: stripeAddress.country || '',
        state: stripeAddress.state || null,
        city: stripeAddress.city || '',
        postalCode: stripeAddress.postal_code || '',
        addressLine1: stripeAddress.line1 || '',
        addressLine2: stripeAddress.line2 || null,
        fullAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    if (DEBUG_MODE) {
      console.log(`📍 New billing address entry created for user ${clerkUserId}:`, {
        id: newAddressEntry.id,
        fullAddress,
        eventId
      });
    }

    // Log de la nueva entrada de dirección
    await logBillingActivity(clerkUserId, 'ADDRESS_HISTORY_ENTRY_CREATED', {
      address: stripeAddress,
      fullAddress,
      addressEntryId: newAddressEntry.id,
      stripeEventId: eventId,
      timestamp: new Date().toISOString(),
    }, `New billing address entry created from Stripe webhook (compliance log)`);

  } catch (error) {
    console.error('❌ Error saving billing address from Stripe:', error);
    throw error;
  }
}

/**
 * Procesa eventos de customer
 */
async function handleCustomerEvent(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;
  const eventType = event.type;
  
  if (DEBUG_MODE) {
    console.log(`👤 Customer ${eventType}:`, {
      id: customer.id,
      email: customer.email,
      clerkUserId: customer.metadata?.clerk_user_id,
      address: customer.address,
    });
  }

  const clerkUserId = customer.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.log('⚠️ Customer event without clerk_user_id, skipping');
    return { success: true };
  }

  // Si el customer tiene dirección y es un evento de actualización, guardarla
  if (eventType === 'customer.updated' && customer.address) {
    try {
      // Extraer nombre y apellido del customer
      const customerName = {
        firstName: customer.name ? customer.name.split(' ')[0] : undefined,
        lastName: customer.name ? customer.name.split(' ').slice(1).join(' ') : undefined
      };
      
      await saveBillingAddressFromStripe(clerkUserId, customer.address, customerName, event.id);
      console.log(`✅ Billing address with name saved for customer ${customer.id}`);
    } catch (error) {
      console.error('❌ Error saving billing address:', error);
    }
  }

  // Log del evento de customer
  await logBillingActivity(clerkUserId, `CUSTOMER_${eventType.split('.')[1].toUpperCase()}`, {
    customerId: customer.id,
    email: customer.email,
    address: customer.address,
    eventType,
    stripeEventId: event.id,
  }, `Customer ${eventType} event`);

  return { success: true };
}

/**
 * Router principal de eventos
 */
async function processStripeEvent(event: Stripe.Event) {
  const eventType = event.type as StripeWebhookEvent;

  try {
    switch (eventType) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(event);
      
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event);
      
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event);
      
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event);
      
      case 'invoice.payment_succeeded':
        return await handlePaymentSucceeded(event);
      
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event);
      
      case 'customer.created':
      case 'customer.updated':
      case 'customer.deleted':
        return await handleCustomerEvent(event);
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return { success: true, skipped: true };
    }
  } catch (error) {
    console.error(`❌ Error processing event ${eventType}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handler principal del webhook
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Obtener payload y signature
    const payload = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 2. Validar firma (solo en producción por ahora)
    let event: Stripe.Event;
    
    if (process.env.NODE_ENV === 'production') {
      const validatedEvent = validateWebhookSignature(payload, signature);
      
      if (!validatedEvent) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      event = validatedEvent;
    } else {
      // En desarrollo, parsear directamente (para testing con Stripe CLI)
      event = JSON.parse(payload);
      console.log('⚠️ DESARROLLO: Validación de firma desactivada');
    }

    // 3. Filtrar solo eventos críticos
    if (!CRITICAL_EVENTS.includes(event.type as any)) {
      if (DEBUG_MODE) {
        console.log(`⏭️ Skipping non-critical event: ${event.type}`);
      }
      return NextResponse.json({ received: true, skipped: true });
    }

    if (DEBUG_MODE) {
      console.log(`📨 Processing Stripe webhook: ${event.type} (${event.id})`);
    }

    // 4. Procesar evento
    const result = await processStripeEvent(event);

    // 5. Respuesta
    return NextResponse.json({
      received: true,
      success: result.success,
      eventType: event.type,
      eventId: event.id,
      message: result.success ? 'Event processed successfully' : 'Event processing failed',
      timestamp: new Date().toISOString(),
    }, { 
      status: result.success ? 200 : 500 
    });

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: DEBUG_MODE ? String(error) : 'Error processing webhook',
    }, { status: 500 });
  }
}

// Handler para métodos no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}