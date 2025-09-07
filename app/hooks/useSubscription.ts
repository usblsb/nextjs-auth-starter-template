/**
 * useSubscription Hook
 * Hook personalizado para gestionar estado de suscripción del usuario
 * Integra con Clerk para autenticación y BD para datos de suscripción
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserSubscriptionStatus } from '@/lib/stripe/types';
import type { AccessLevel } from '@/lib/middleware/subscriptionMiddleware';

interface UseSubscriptionReturn {
  // Estado de suscripción
  subscription: UserSubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Métodos de utilidad
  hasAccess: (requiredLevel: AccessLevel) => boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  isFree: boolean;
  
  // Métodos de actualización
  refresh: () => Promise<void>;
  checkAccess: (requiredLevel: AccessLevel) => Promise<boolean>;
}

/**
 * Hook principal para gestionar suscripciones
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, isLoaded } = useUser();
  
  const [subscription, setSubscription] = useState<UserSubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene el estado de suscripción desde la API
   */
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/subscription-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
      } else {
        throw new Error(data.error || 'Failed to fetch subscription status');
      }

    } catch (err) {
      console.error('❌ Error fetching subscription status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Estado por defecto en caso de error
      setSubscription({
        isSubscribed: false,
        accessLevel: 'FREE',
      });
      
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Efecto para cargar estado inicial
   */
  useEffect(() => {
    if (isLoaded) {
      fetchSubscriptionStatus();
    }
  }, [isLoaded, fetchSubscriptionStatus]);

  /**
   * Verifica si el usuario tiene acceso a un nivel específico
   */
  const hasAccess = useCallback((requiredLevel: AccessLevel): boolean => {
    if (!subscription) {
      return requiredLevel === 'OPEN';
    }

    const accessHierarchy: Record<AccessLevel, number> = {
      'OPEN': 0,
      'FREE': 1,
      'PREMIUM': 2
    };

    const userLevel = subscription.accessLevel || 'FREE';
    return accessHierarchy[userLevel] >= accessHierarchy[requiredLevel];
  }, [subscription]);

  /**
   * Verifica acceso de manera asíncrona (útil para verificaciones frescas)
   */
  const checkAccess = useCallback(async (requiredLevel: AccessLevel): Promise<boolean> => {
    await fetchSubscriptionStatus();
    return hasAccess(requiredLevel);
  }, [fetchSubscriptionStatus, hasAccess]);

  /**
   * Actualiza manualmente el estado de suscripción
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Estados derivados para facilitar uso
  const isSubscribed = subscription?.isSubscribed ?? false;
  const isPremium = subscription?.accessLevel === 'PREMIUM';
  const isFree = subscription?.accessLevel === 'FREE';

  return {
    // Estado principal
    subscription,
    isLoading,
    error,
    
    // Métodos de verificación
    hasAccess,
    isSubscribed,
    isPremium,
    isFree,
    
    // Métodos de actualización
    refresh,
    checkAccess,
  };
}

/**
 * Hook simplificado para verificación rápida de acceso
 */
export function useAccessLevel(): {
  accessLevel: AccessLevel;
  isLoading: boolean;
  hasAccess: (required: AccessLevel) => boolean;
} {
  const { subscription, isLoading, hasAccess } = useSubscription();
  
  const accessLevel = subscription?.accessLevel || 'OPEN';
  
  return {
    accessLevel,
    isLoading,
    hasAccess,
  };
}

/**
 * Hook para verificar si el usuario es Premium
 */
export function usePremiumAccess(): {
  isPremium: boolean;
  isLoading: boolean;
  subscription: UserSubscriptionStatus | null;
  upgrade: () => void;
} {
  const { subscription, isLoading, isPremium } = useSubscription();
  
  const upgrade = useCallback(() => {
    window.location.href = '/web-dashboard/billing?upgrade=true';
  }, []);
  
  return {
    isPremium,
    isLoading,
    subscription,
    upgrade,
  };
}

/**
 * Hook para gestionar estados de suscripción con caché
 */
export function useSubscriptionCache(cacheTtl: number = 300000): UseSubscriptionReturn {
  const baseHook = useSubscription();
  const [lastFetch, setLastFetch] = useState<number>(0);

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetch > cacheTtl) {
      await baseHook.refresh();
      setLastFetch(now);
    }
  }, [baseHook.refresh, lastFetch, cacheTtl]);

  return {
    ...baseHook,
    refresh,
  };
}

/**
 * Utilidades de exportación
 */
export default useSubscription;