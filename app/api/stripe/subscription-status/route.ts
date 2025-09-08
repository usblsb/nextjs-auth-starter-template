/**
 * API Endpoint: Obtener estado de suscripción del usuario
 * GET /api/stripe/subscription-status
 * 
 * Retorna información completa sobre la suscripción actual del usuario,
 * planes disponibles y nivel de acceso a contenido
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscriptionStatus, getAvailablePlans } from '@/lib/services/billingService';
import { getCustomerByClerkUserId } from '@/lib/services/stripeService';

export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    console.log(`🔧 [SUBSCRIPTION-STATUS API] Clerk auth result:`, {
      userId: userId,
      hasUserId: !!userId,
      userIdType: typeof userId,
    });
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    console.log(`📊 Getting subscription status for user ${userId}`);

    // 2. Obtener estado de suscripción desde BD
    const subscriptionStatus = await getUserSubscriptionStatus(userId);
    
    console.log('🔍 Subscription status result:', {
      userId,
      isSubscribed: subscriptionStatus.isSubscribed,
      accessLevel: subscriptionStatus.accessLevel,
      status: subscriptionStatus.status,
      currentPlan: subscriptionStatus.currentPlan?.name
    });

    // 3. Obtener planes disponibles
    const availablePlans = await getAvailablePlans();

    // 4. Obtener información de customer de Stripe (si existe)
    let stripeCustomerInfo = null;
    const customerResult = await getCustomerByClerkUserId(userId);
    
    if (customerResult.success && customerResult.customer) {
      stripeCustomerInfo = {
        id: customerResult.customer.id,
        email: customerResult.customer.email,
        created: new Date(customerResult.customer.created * 1000),
        defaultPaymentMethod: customerResult.customer.default_source || null,
      };
    }

    // 5. Determinar capacidades del usuario
    const capabilities = {
      canSubscribe: !subscriptionStatus.isSubscribed,
      canUpgrade: subscriptionStatus.isSubscribed && subscriptionStatus.accessLevel !== 'PREMIUM',
      canDowngrade: subscriptionStatus.isSubscribed && subscriptionStatus.accessLevel === 'PREMIUM',
      canCancel: subscriptionStatus.isSubscribed && 
                (subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trialing'),
      canAccessPortal: !!stripeCustomerInfo,
      canAccessPremiumContent: subscriptionStatus.accessLevel === 'PREMIUM',
    };

    // 6. Información de contenido accesible
    const contentAccess = {
      level: subscriptionStatus.accessLevel,
      accessibleContent: getAccessibleContentTypes(subscriptionStatus.accessLevel),
      restrictedContent: getRestrictedContentTypes(subscriptionStatus.accessLevel),
    };

    // 7. Respuesta completa
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          hasSubscription: subscriptionStatus.isSubscribed,
          accessLevel: subscriptionStatus.accessLevel,
        },
        subscription: subscriptionStatus.isSubscribed ? {
          status: subscriptionStatus.status,
          currentPlan: subscriptionStatus.currentPlan,
          currentPeriodEnd: subscriptionStatus.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionStatus.cancelAtPeriodEnd,
        } : null,
        stripeCustomer: stripeCustomerInfo,
        availablePlans,
        capabilities,
        contentAccess,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in subscription-status endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while fetching subscription status'
      },
      { status: 500 }
    );
  }
}

// También aceptar POST para compatibilidad con algunos clientes
export async function POST(req: NextRequest) {
  return GET(req);
}

/**
 * Helper: Obtener tipos de contenido accesibles según nivel
 */
function getAccessibleContentTypes(accessLevel: string): string[] {
  switch (accessLevel) {
    case 'PREMIUM':
      return ['OPEN', 'FREE', 'PREMIUM'];
    case 'FREE':
      return ['OPEN', 'FREE'];
    default:
      return ['OPEN'];
  }
}

/**
 * Helper: Obtener tipos de contenido restringidos según nivel
 */
function getRestrictedContentTypes(accessLevel: string): string[] {
  switch (accessLevel) {
    case 'PREMIUM':
      return []; // Sin restricciones
    case 'FREE':
      return ['PREMIUM'];
    default:
      return ['FREE', 'PREMIUM'];
  }
}