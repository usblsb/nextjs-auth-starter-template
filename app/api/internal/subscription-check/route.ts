/**
 * API Interna: Verificación de suscripción para middleware
 * POST /api/internal/subscription-check
 * 
 * Esta API se usa internamente por el middleware para verificar 
 * el estado de suscripción sin ejecutar Prisma en Edge Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { AccessLevel } from '@/lib/middleware/subscriptionMiddleware';
import { withDatabaseRetry } from '@/lib/utils/retrySystem';
import { rateLimiters, addRateLimitHeaders } from '@/lib/utils/rateLimiter';
import { cacheUtils } from '@/lib/cache/subscriptionCache';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = rateLimiters.public.checkLimit('internal-api');
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    const { userId } = await req.json();
    
    if (!userId) {
      const response = NextResponse.json(
        { accessLevel: 'OPEN' as AccessLevel },
        { status: 200 }
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // 2. Buscar suscripción activa en BD con retry
    const dbOperation = () => prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing', 'past_due']
            }
          },
          include: {
            billingPlan: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    const retryResult = await withDatabaseRetry(dbOperation);

    if (!retryResult.success) {
      console.error('❌ Database query failed after retries:', retryResult.error);
      const response = NextResponse.json(
        { 
          accessLevel: 'FREE' as AccessLevel,
          hasActiveSubscription: false,
          userId,
          error: 'Database error'
        },
        { status: 200 } // 200 para no bloquear middleware
      );
      addRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    const userWithSubscription = retryResult.result;
    let accessLevel: AccessLevel = 'FREE'; // Usuario registrado por defecto

    if (userWithSubscription?.subscriptions && userWithSubscription.subscriptions.length > 0) {
      const subscription = userWithSubscription.subscriptions[0];
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        accessLevel = 'PREMIUM';
      }
    }

    // Si no existe perfil de usuario, es OPEN
    if (!userWithSubscription) {
      accessLevel = 'OPEN';
    }

    const response = NextResponse.json({ 
      accessLevel,
      hasActiveSubscription: accessLevel === 'PREMIUM',
      userId,
      _performance: {
        attempts: retryResult.attempts,
        totalTime: retryResult.totalTime,
        source: 'database',
      }
    });

    addRateLimitHeaders(response, rateLimitResult);
    return response;

  } catch (error) {
    console.error('❌ Error in subscription-check API:', error);
    
    // En caso de error, dar acceso básico para no bloquear
    return NextResponse.json(
      { 
        accessLevel: 'FREE' as AccessLevel,
        error: 'Database error'
      },
      { status: 200 } // 200 para que middleware continue
    );
  }
}