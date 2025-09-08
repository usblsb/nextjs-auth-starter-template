/**
 * API Endpoint: Procesar éxito de Stripe Checkout
 * POST /api/stripe/checkout-success
 * 
 * Flujo:
 * 1. Validar session_id de Stripe
 * 2. Recuperar suscripción creada
 * 3. Sincronizar con BD
 * 4. Registrar logs de actividad
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { syncSubscriptionToDB, logBillingActivity } from '@/lib/services/billingService';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parsear datos del request
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`✅ Processing checkout success for user ${userId}, session: ${sessionId}`);

    // 3. Recuperar información de la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (!session.subscription || typeof session.subscription === 'string') {
      return NextResponse.json(
        { error: 'No subscription found in session' },
        { status: 400 }
      );
    }

    // 4. Verificar que el usuario coincida
    if (session.client_reference_id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // 5. Obtener detalles completos de la suscripción
    const subscription = await stripe.subscriptions.retrieve(session.subscription.id);

    console.log('📦 Subscription details retrieved:', {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer,
    });

    // 6. Sincronizar suscripción con BD
    const syncResult = await syncSubscriptionToDB(subscription, userId);

    if (!syncResult.success) {
      console.error('⚠️ Failed to sync subscription to database:', syncResult.error);
    }

    // 7. Registrar actividad de éxito
    await logBillingActivity(userId, 'CHECKOUT_COMPLETED', {
      sessionId,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      amount: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency,
    }, 'Subscription successfully created via Stripe Checkout');

    // 8. Respuesta exitosa
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      message: 'Subscription processed successfully',
    });

  } catch (error) {
    console.error('❌ Error processing checkout success:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to process checkout success'
      },
      { status: 500 }
    );
  }
}