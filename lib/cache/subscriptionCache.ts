/**
 * Sistema de caché en memoria para verificaciones de suscripción
 * Reduce la carga en BD y mejora el rendimiento del middleware
 */

import type { AccessLevel } from '@/lib/middleware/subscriptionMiddleware';

interface CacheEntry {
  accessLevel: AccessLevel;
  hasActiveSubscription: boolean;
  userId: string;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

class SubscriptionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_ENTRIES = 1000; // Límite de entradas
  private stats = { hits: 0, misses: 0 };

  /**
   * Obtiene datos del caché si están disponibles y válidos
   */
  get(userId: string): CacheEntry | null {
    const entry = this.cache.get(userId);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar si la entrada ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry;
  }

  /**
   * Guarda datos en el caché
   */
  set(userId: string, data: Omit<CacheEntry, 'timestamp' | 'expiresAt'>, ttl: number = this.DEFAULT_TTL): void {
    // Limpiar entradas expiradas si el caché está lleno
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.cleanup();
    }

    const now = Date.now();
    const entry: CacheEntry = {
      ...data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(userId, entry);
  }

  /**
   * Invalida una entrada específica del caché
   */
  invalidate(userId: string): boolean {
    return this.cache.delete(userId);
  }

  /**
   * Invalida múltiples entradas
   */
  invalidateMultiple(userIds: string[]): number {
    let deleted = 0;
    for (const userId of userIds) {
      if (this.cache.delete(userId)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    let deleted = 0;

    for (const [userId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(userId);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Obtiene información detallada de una entrada
   */
  getEntryInfo(userId: string): (CacheEntry & { isExpired: boolean; timeToLive: number }) | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;

    const now = Date.now();
    return {
      ...entry,
      isExpired: now > entry.expiresAt,
      timeToLive: Math.max(0, entry.expiresAt - now),
    };
  }

  /**
   * Obtiene todas las entradas del caché (para debugging)
   */
  getAllEntries(): Array<{ userId: string; entry: CacheEntry & { isExpired: boolean } }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([userId, entry]) => ({
      userId,
      entry: {
        ...entry,
        isExpired: now > entry.expiresAt,
      },
    }));
  }

  /**
   * Configura un cleanup automático
   */
  startAutoCleanup(intervalMs: number = 10 * 60 * 1000): () => void {
    const interval = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, intervalMs);

    // Retornar función para detener el cleanup
    return () => clearInterval(interval);
  }
}

// Instancia singleton del caché
export const subscriptionCache = new SubscriptionCache();

// Auto-cleanup cada 10 minutos
if (typeof window === 'undefined') { // Solo en servidor
  subscriptionCache.startAutoCleanup();
}

/**
 * Hook para usar el caché de suscripciones en React
 */
export function useSubscriptionCache(userId: string | null, ttl?: number) {
  if (!userId) return null;

  const cached = subscriptionCache.get(userId);
  if (cached) {
    return {
      ...cached,
      source: 'cache' as const,
    };
  }

  return null;
}

/**
 * Utilidades para gestionar el caché
 */
export const cacheUtils = {
  /**
   * Invalida caché cuando una suscripción cambia
   */
  onSubscriptionChange: (userId: string) => {
    subscriptionCache.invalidate(userId);
    console.log(`🗑️ Cache invalidated for user: ${userId}`);
  },

  /**
   * Invalida caché para múltiples usuarios (útil para webhooks masivos)
   */
  onBulkSubscriptionChange: (userIds: string[]) => {
    const deleted = subscriptionCache.invalidateMultiple(userIds);
    console.log(`🗑️ Cache invalidated for ${deleted} users`);
  },

  /**
   * Pre-carga datos en el caché
   */
  preload: (userId: string, data: Omit<CacheEntry, 'timestamp' | 'expiresAt'>, ttl?: number) => {
    subscriptionCache.set(userId, data, ttl);
    console.log(`📥 Cache preloaded for user: ${userId}`);
  },

  /**
   * Obtiene métricas del caché
   */
  getMetrics: () => subscriptionCache.getStats(),

  /**
   * Limpieza manual
   */
  cleanup: () => {
    const cleaned = subscriptionCache.cleanup();
    console.log(`🧹 Manual cleanup: removed ${cleaned} expired entries`);
    return cleaned;
  },
};

export type { CacheEntry, CacheStats };