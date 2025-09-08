/**
 * API para crear PaymentIntent básico
 * Solo para probar que Payment Element pide tarjeta correctamente
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { linkUserToStripeCustomer } from '@/lib/services/billingService';

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
    const { amount = 2900, currency = 'eur' } = await req.json(); // €29.00 por defecto

    console.log(`💳 Creating PaymentIntent for user ${userId}: ${amount/100} ${currency.toUpperCase()}`);

    // 3. Obtener información del usuario de Clerk
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // 4. Crear o encontrar customer en Stripe
    const customerResult = await linkUserToStripeCustomer(userId, email);
    
    if (!customerResult.success || !customerResult.customerId) {
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    console.log('✅ Customer found/created:', customerResult.customerId);

    // 5. Crear PaymentIntent asociado al customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // En centimos (2900 = €29.00)
      currency,
      customer: customerResult.customerId, // ¡ESTO ES LO IMPORTANTE!
      setup_future_usage: 'off_session', // ¡ESTO PERMITE REUTILIZAR EL PAYMENT METHOD!
      metadata: {
        clerk_user_id: userId,
        created_via: 'payment_element_for_subscription',
      },
      automatic_payment_methods: {
        enabled: true, // Habilita tarjetas, Apple Pay, Google Pay, etc.
      },
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    // 6. Respuesta con client_secret para Payment Element
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

  } catch (error) {
    console.error('❌ Error creating PaymentIntent:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to create payment intent'
      },
      { status: 500 }
    );
  }
}