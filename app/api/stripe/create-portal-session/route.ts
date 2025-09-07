/**
 * API Endpoint: Crear sesión del Portal de Stripe
 * POST /api/stripe/create-portal-session
 * 
 * Permite a los usuarios acceder al portal de autogestión de Stripe
 * donde pueden actualizar métodos de pago, descargar facturas, etc.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, getCustomerByClerkUserId } from '@/lib/services/stripeService';
import { logBillingActivity } from '@/lib/services/billingService';

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

    // 2. Obtener URL de retorno del request (opcional)
    const body = await req.json().catch(() => ({}));
    const { returnUrl } = body;

    console.log(`🎛️ Creating portal session for user ${userId}`);

    // 3. Buscar customer de Stripe para este usuario
    const customerResult = await getCustomerByClerkUserId(userId);

    if (!customerResult.success || !customerResult.customer) {
      return NextResponse.json(
        { 
          error: 'Stripe customer not found',
          message: 'You need to have an active subscription to access the billing portal'
        },
        { status: 404 }
      );
    }

    const customer = customerResult.customer;

    // 4. Crear sesión del portal
    const portalResult = await createPortalSession(
      customer.id,
      returnUrl || `${getBaseUrl(req)}/web-dashboard/billing`
    );

    if (!portalResult.success || !portalResult.url) {
      console.error('❌ Failed to create portal session:', portalResult.error);
      return NextResponse.json(
        { error: portalResult.error || 'Failed to create portal session' },
        { status: 500 }
      );
    }

    // 5. Log de actividad
    await logBillingActivity(userId, 'PORTAL_SESSION_CREATED', {
      customerId: customer.id,
      portalUrl: portalResult.url,
      returnUrl: returnUrl || 'default',
    }, 'User accessed Stripe billing portal');

    // 6. Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        url: portalResult.url,
        message: 'Portal session created successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in create-portal-session endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while creating the portal session'
      },
      { status: 500 }
    );
  }
}

// Método GET para validar acceso al portal
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar si el usuario tiene customer en Stripe
    const customerResult = await getCustomerByClerkUserId(userId);

    const hasAccess = customerResult.success && !!customerResult.customer;

    return NextResponse.json({
      success: true,
      hasPortalAccess: hasAccess,
      customerId: hasAccess ? customerResult.customer?.id : null,
      message: hasAccess 
        ? 'Portal access available'
        : 'No Stripe customer found - portal access not available',
    });

  } catch (error) {
    console.error('❌ Error in create-portal-session GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper para obtener URL base de la aplicación
 */
function getBaseUrl(req: NextRequest): string {
  // En producción, usar variable de entorno
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // En desarrollo, construir desde headers
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  
  return `${protocol}://${host}`;
}