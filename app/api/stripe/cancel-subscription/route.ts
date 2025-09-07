/**
 * API Endpoint: Cancelar suscripción
 * POST /api/stripe/cancel-subscription
 * 
 * Permite cancelar suscripción inmediatamente o al final del período
 * Sincroniza cambios con BD y registra logs de actividad
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { cancelUserSubscription, getUserSubscriptionStatus } from '@/lib/services/billingService';

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
    const { subscriptionId, cancelAtPeriodEnd = true, reason } = body;

    // 3. Validar datos requeridos
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    // 4. Verificar que el usuario tiene una suscripción activa
    const currentStatus = await getUserSubscriptionStatus(userId);
    
    if (!currentStatus.isSubscribed) {
      return NextResponse.json(
        { error: 'No active subscription found for user' },
        { status: 404 }
      );
    }

    console.log(`🚫 Cancelling subscription for user ${userId}:`, {
      subscriptionId,
      cancelAtPeriodEnd,
      reason: reason || 'No reason provided',
    });

    // 5. Cancelar suscripción
    const result = await cancelUserSubscription(userId, subscriptionId, cancelAtPeriodEnd);

    if (!result.success) {
      console.error('❌ Failed to cancel subscription:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // 6. Respuesta exitosa
    const responseMessage = cancelAtPeriodEnd
      ? 'Subscription will be cancelled at the end of the current billing period'
      : 'Subscription has been cancelled immediately';

    return NextResponse.json(
      {
        success: true,
        subscriptionId,
        cancelAtPeriodEnd,
        message: responseMessage,
        effectiveDate: cancelAtPeriodEnd 
          ? currentStatus.currentPeriodEnd 
          : new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in cancel-subscription endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while cancelling the subscription'
      },
      { status: 500 }
    );
  }
}

// Método GET para obtener información de cancelación
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener estado actual de suscripción
    const subscriptionStatus = await getUserSubscriptionStatus(userId);

    if (!subscriptionStatus.isSubscribed) {
      return NextResponse.json(
        { 
          hasSubscription: false,
          message: 'No active subscription found'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      currentPlan: subscriptionStatus.currentPlan,
      currentPeriodEnd: subscriptionStatus.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionStatus.cancelAtPeriodEnd,
      canCancel: subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trialing',
      cancellationPolicies: {
        immediate: {
          available: true,
          description: 'Cancel immediately with prorated refund',
          effectiveDate: 'now',
        },
        endOfPeriod: {
          available: true,
          description: 'Cancel at end of current billing period',
          effectiveDate: subscriptionStatus.currentPeriodEnd,
          recommended: true,
        },
      },
    });

  } catch (error) {
    console.error('❌ Error in cancel-subscription GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}