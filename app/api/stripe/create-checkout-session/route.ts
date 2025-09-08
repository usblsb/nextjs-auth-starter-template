/**
 * API Endpoint: Crear sesión de Checkout con Stripe
 * POST /api/stripe/create-checkout-session
 * 
 * Flujo:
 * 1. Validar usuario autenticado (Clerk)
 * 2. Crear sesión de Stripe Checkout con precios automáticos de impuestos
 * 3. Retornar URL de checkout para redirección
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { determineTaxConfiguration } from '@/lib/services/taxService';
import type { CreateSubscriptionData } from '@/lib/stripe/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // 2. Parsear datos del request
    const body = await req.json();
    const { priceId, email, billingAddress, metadata = {} } = body;

    // 3. Validar datos requeridos
    if (!priceId || !email || !billingAddress) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['priceId', 'email', 'billingAddress']
        },
        { status: 400 }
      );
    }

    // 4. Detectar configuración fiscal
    const taxInfo = determineTaxConfiguration({
      country: billingAddress.country,
      postalCode: billingAddress.postalCode,
    });

    console.log(`🛒 Creating checkout session for user ${userId}:`, {
      priceId,
      country: billingAddress.country,
      postalCode: billingAddress.postalCode,
      taxRegion: taxInfo.region,
      taxType: taxInfo.taxConfig.type,
    });

    // 5. Obtener el hostname para las URLs de éxito y cancelación
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // 6. Crear sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        ...metadata,
        clerk_user_id: userId,
        created_via: 'checkout_api',
        tax_region: taxInfo.region,
      },
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      success_url: `${baseUrl}/web-dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/web-dashboard/billing?canceled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          tax_region: taxInfo.region,
        },
      },
    });

    console.log('✅ Checkout session created:', session.id);

    // 7. Respuesta exitosa con URL de checkout
    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        taxInfo: {
          region: taxInfo.region,
          description: taxInfo.taxConfig.description,
          rate: taxInfo.taxConfig.rate,
          isCanaryIslands: taxInfo.isCanaryIslands,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in create-checkout-session endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while creating the checkout session'
      },
      { status: 500 }
    );
  }
}