/**
 * API Endpoint: Crear suscripción con fiscalidad española automática
 * POST /api/stripe/create-subscription
 * 
 * Flujo:
 * 1. Validar usuario autenticado (Clerk)
 * 2. Detectar fiscalidad por dirección (IVA/IGIC)
 * 3. Crear suscripción en Stripe
 * 4. Sincronizar con BD
 * 5. Retornar client_secret para frontend
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createUserSubscription } from '@/lib/services/billingService';
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

    // 4. Validar dirección de facturación
    const requiredAddressFields = ['country', 'postalCode', 'city', 'line1'];
    const missingFields = requiredAddressFields.filter(field => !billingAddress[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Incomplete billing address', 
          missingFields 
        },
        { status: 400 }
      );
    }

    // 5. Detectar configuración fiscal
    const taxInfo = determineTaxConfiguration({
      country: billingAddress.country,
      postalCode: billingAddress.postalCode,
    });

    console.log(`🏗️ Creating subscription for user ${userId}:`, {
      priceId,
      country: billingAddress.country,
      postalCode: billingAddress.postalCode,
      taxRegion: taxInfo.region,
      taxType: taxInfo.taxConfig.type,
    });

    // 6. Preparar datos para crear suscripción
    const subscriptionData: CreateSubscriptionData = {
      userId,
      priceId,
      email,
      billingAddress,
      metadata: {
        ...metadata,
        clerk_user_id: userId,
        created_via: 'api',
        tax_region: taxInfo.region,
      },
    };

    // 7. Crear suscripción con sincronización BD
    const result = await createUserSubscription(userId, subscriptionData);

    if (!result.success) {
      console.error('❌ Failed to create subscription:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // 8. Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        subscriptionId: result.subscriptionId,
        clientSecret: result.clientSecret,
        taxInfo: {
          region: taxInfo.region,
          description: taxInfo.taxConfig.description,
          rate: taxInfo.taxConfig.rate,
          isCanaryIslands: taxInfo.isCanaryIslands,
        },
        message: `Subscription created with ${taxInfo.taxConfig.description}`,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in create-subscription endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while creating the subscription'
      },
      { status: 500 }
    );
  }
}

// Método GET para obtener información sobre configuración fiscal
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener parámetros de query para preview de impuestos
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const postalCode = searchParams.get('postalCode');

    if (!country) {
      return NextResponse.json(
        { error: 'Country parameter required' },
        { status: 400 }
      );
    }

    // Detectar configuración fiscal para preview
    const taxInfo = determineTaxConfiguration({
      country,
      postalCode: postalCode || undefined,
    });

    return NextResponse.json({
      success: true,
      taxInfo: {
        region: taxInfo.region,
        description: taxInfo.taxConfig.description,
        rate: taxInfo.taxConfig.rate,
        isCanaryIslands: taxInfo.isCanaryIslands,
        country: taxInfo.country,
      },
    });

  } catch (error) {
    console.error('❌ Error in create-subscription GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}