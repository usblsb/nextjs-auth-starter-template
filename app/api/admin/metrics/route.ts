/**
 * API de métricas y analytics del sistema
 * GET /api/admin/metrics
 * 
 * Proporciona métricas de rendimiento, cache, rate limiting y conversiones
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subscriptionCache, cacheUtils } from '@/lib/cache/subscriptionCache';
import { rateLimiters } from '@/lib/utils/rateLimiter';
import { requireAdmin } from '@/lib/services/adminService';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación (solo admins)
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar rol de admin
    try {
      await requireAdmin();
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Se requieren permisos de administrador' }, 
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') || '7d'; // 1d, 7d, 30d
    const includeCache = searchParams.get('cache') === 'true';
    const includeRateLimit = searchParams.get('rateLimit') === 'true';

    console.log(`📊 Admin metrics request: range=${timeRange}, cache=${includeCache}, rateLimit=${includeRateLimit}`);

    // 2. Calcular fechas para el rango
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default: // 7d
        startDate.setDate(now.getDate() - 7);
        break;
    }

    // 3. Obtener métricas de base de datos
    const [
      totalUsers,
      newUsers,
      activeSubscriptions,
      newSubscriptions,
      totalRevenue,
      recentActivity,
      conversionMetrics,
    ] = await Promise.all([
      // Total de usuarios
      prisma.userProfile.count({
        where: { isActive: true }
      }),

      // Nuevos usuarios en el rango
      prisma.userProfile.count({
        where: {
          createdAt: { gte: startDate },
          isActive: true
        }
      }),

      // Suscripciones activas
      prisma.userSubscription.count({
        where: {
          status: { in: ['active', 'trialing'] }
        }
      }),

      // Nuevas suscripciones en el rango
      prisma.userSubscription.count({
        where: {
          createdAt: { gte: startDate },
          status: { in: ['active', 'trialing'] }
        }
      }),

      // Revenue total estimado (basado en suscripciones activas)
      prisma.userSubscription.findMany({
        where: {
          status: { in: ['active', 'trialing'] }
        },
        include: {
          billingPlan: true
        }
      }).then(subscriptions => 
        subscriptions.reduce((total, sub) => {
          const monthlyRevenue = sub.billingPlan?.interval === 'year' 
            ? Number(sub.billingPlan.price) / 12
            : Number(sub.billingPlan?.price || 0);
          return total + monthlyRevenue;
        }, 0)
      ),

      // Actividad reciente
      prisma.userActivityLog.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          action: true,
          createdAt: true,
          resourceType: true,
        }
      }),

      // Métricas de conversión
      getConversionMetrics(startDate),
    ]);

    // 4. Calcular métricas derivadas
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
    const avgRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

    // 5. Agrupar actividad por tipo
    const activityByType = recentActivity.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 6. Obtener métricas de caché si se solicita
    let cacheMetrics = null;
    if (includeCache) {
      cacheMetrics = {
        subscription: cacheUtils.getMetrics(),
        performance: await getCachePerformanceMetrics(),
      };
    }

    // 7. Obtener métricas de rate limiting si se solicita
    let rateLimitMetrics = null;
    if (includeRateLimit) {
      rateLimitMetrics = {
        subscription: rateLimiters.subscription.getStats(),
        billing: rateLimiters.billing.getStats(),
        user: rateLimiters.user.getStats(),
        public: rateLimiters.public.getStats(),
      };
    }

    // 8. Compilar respuesta
    const metrics = {
      summary: {
        totalUsers,
        newUsers,
        activeSubscriptions,
        newSubscriptions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      },
      
      growth: {
        userGrowthRate: totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100 * 100) / 100 : 0,
        subscriptionGrowthRate: activeSubscriptions > 0 
          ? Math.round((newSubscriptions / activeSubscriptions) * 100 * 100) / 100 
          : 0,
      },

      activity: {
        recentActions: Object.entries(activityByType)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([action, count]) => ({ action, count })),
        totalRecentActivity: recentActivity.length,
      },

      conversion: conversionMetrics,

      ...(cacheMetrics && { cache: cacheMetrics }),
      ...(rateLimitMetrics && { rateLimit: rateLimitMetrics }),

      metadata: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        generatedAt: now.toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      metrics,
    });

  } catch (error) {
    console.error('❌ Error getting admin metrics:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to get metrics'
      },
      { status: 500 }
    );
  }
}

/**
 * Obtiene métricas de conversión del funnel
 */
async function getConversionMetrics(startDate: Date) {
  // Obtener datos del funnel de conversión
  const [
    registrations,
    profileCompletions,
    subscriptionAttempts,
    successfulSubscriptions,
  ] = await Promise.all([
    prisma.userActivityLog.count({
      where: {
        action: 'USER_REGISTERED',
        createdAt: { gte: startDate }
      }
    }),

    prisma.userActivityLog.count({
      where: {
        action: 'PROFILE_COMPLETED',
        createdAt: { gte: startDate }
      }
    }),

    prisma.userActivityLog.count({
      where: {
        action: { contains: 'BILLING_' },
        createdAt: { gte: startDate }
      }
    }),

    prisma.userActivityLog.count({
      where: {
        action: 'BILLING_SUBSCRIPTION_CREATED',
        createdAt: { gte: startDate }
      }
    }),
  ]);

  return {
    funnel: {
      registrations,
      profileCompletions,
      subscriptionAttempts,
      successfulSubscriptions,
    },
    rates: {
      profileCompletionRate: registrations > 0 
        ? Math.round((profileCompletions / registrations) * 100 * 100) / 100
        : 0,
      subscriptionConversionRate: registrations > 0 
        ? Math.round((successfulSubscriptions / registrations) * 100 * 100) / 100
        : 0,
      subscriptionSuccessRate: subscriptionAttempts > 0
        ? Math.round((successfulSubscriptions / subscriptionAttempts) * 100 * 100) / 100
        : 0,
    },
  };
}

/**
 * Obtiene métricas de rendimiento del caché
 */
async function getCachePerformanceMetrics() {
  // Simular métricas de rendimiento (en una implementación real, 
  // esto vendría de un sistema de métricas como Prometheus)
  return {
    avgResponseTime: Math.round(Math.random() * 100 + 50), // 50-150ms simulado
    cacheHitLatency: Math.round(Math.random() * 10 + 5), // 5-15ms simulado
    cacheMissLatency: Math.round(Math.random() * 200 + 100), // 100-300ms simulado
    memoryUsage: Math.round(Math.random() * 50 + 25), // 25-75MB simulado
  };
}