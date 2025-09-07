/**
 * Servicio simplificado para middleware
 * No usa Prisma directamente - hace llamadas a API interna
 * Incluye sistema de caché para optimización
 */

import type { AccessLevel } from './subscriptionMiddleware';
import { subscriptionCache } from '@/lib/cache/subscriptionCache';

export interface UserSubscriptionInfo {
  accessLevel: AccessLevel;
  hasActiveSubscription: boolean;
  userId: string;
  error?: string;
}

/**
 * Obtiene el estado de suscripción del usuario para middleware
 * Usa API interna para evitar Prisma en Edge Runtime
 */
export async function getUserSubscriptionForMiddleware(
  userId: string | null,
  baseUrl: string
): Promise<UserSubscriptionInfo> {
  try {
    if (!userId) {
      return {
        accessLevel: 'OPEN',
        hasActiveSubscription: false,
        userId: ''
      };
    }

    // 1. Intentar obtener del caché primero
    const cached = subscriptionCache.get(userId);
    if (cached) {
      return {
        accessLevel: cached.accessLevel,
        hasActiveSubscription: cached.hasActiveSubscription,
        userId: cached.userId,
      };
    }

    // 2. Si no está en caché, llamar a API interna
    const response = await fetch(`${baseUrl}/api/internal/subscription-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      console.error('❌ Subscription check API failed:', response.status);
      return {
        accessLevel: 'FREE',
        hasActiveSubscription: false,
        userId,
        error: 'API_ERROR'
      };
    }

    const data = await response.json();
    
    const result = {
      accessLevel: data.accessLevel || 'FREE',
      hasActiveSubscription: data.hasActiveSubscription || false,
      userId: data.userId || userId,
      error: data.error
    };

    // 3. Guardar en caché para futuras consultas (solo si no hay error)
    if (!result.error) {
      subscriptionCache.set(userId, {
        accessLevel: result.accessLevel,
        hasActiveSubscription: result.hasActiveSubscription,
        userId: result.userId,
      });
    }

    return result;

  } catch (error) {
    console.error('❌ Error getting user subscription for middleware:', error);
    
    // En caso de error, dar acceso básico para no bloquear completamente
    return {
      accessLevel: 'FREE',
      hasActiveSubscription: false,
      userId: userId || '',
      error: 'NETWORK_ERROR'
    };
  }
}