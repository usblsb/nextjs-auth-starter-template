/**
 * Sistema de rate limiting para APIs
 * Previene abuso y mejora la estabilidad del sistema
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en ms
  maxRequests: number;   // Máximo de requests por ventana
  blockDurationMs: number; // Duración del bloqueo
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  retryAfter?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => id,
      ...config,
    };

    // Auto-cleanup cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Verifica si una request está permitida
   */
  checkLimit(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();
    
    let entry = this.store.get(key);

    // Si no existe la entrada, crearla
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      };
    }

    // Si ha pasado la ventana de tiempo, resetear
    if (now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      };
    }

    // Si está bloqueado, verificar si ya se puede desbloquear
    if (entry.blocked) {
      const blockEndTime = entry.resetTime + this.config.blockDurationMs;
      if (now < blockEndTime) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          blocked: true,
          retryAfter: blockEndTime - now,
        };
      } else {
        // Desbloquear y resetear
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
          blocked: false,
        };
      }
    }

    // Incrementar contador
    entry.count++;

    // Verificar si se ha excedido el límite
    if (entry.count > this.config.maxRequests) {
      entry.blocked = true;
      this.store.set(key, entry);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
        retryAfter: this.config.blockDurationMs,
      };
    }

    // Guardar entrada actualizada
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      const isExpired = now > (entry.resetTime + this.config.blockDurationMs);
      if (isExpired) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    const now = Date.now();
    let active = 0;
    let blocked = 0;

    for (const entry of this.store.values()) {
      if (now < entry.resetTime) {
        active++;
        if (entry.blocked) blocked++;
      }
    }

    return {
      totalEntries: this.store.size,
      activeEntries: active,
      blockedEntries: blocked,
    };
  }

  /**
   * Resetea el límite para un identificador específico
   */
  reset(identifier: string): boolean {
    const key = this.config.keyGenerator(identifier);
    return this.store.delete(key);
  }

  /**
   * Limpia todos los límites
   */
  clear(): void {
    this.store.clear();
  }
}

// Configuraciones predefinidas para diferentes tipos de endpoints
export const rateLimitConfigs = {
  // Para APIs sensibles (suscripciones, pagos)
  strict: {
    windowMs: 15 * 60 * 1000,    // 15 minutos
    maxRequests: 5,              // 5 requests por ventana
    blockDurationMs: 60 * 60 * 1000, // Bloqueo de 1 hora
  },

  // Para APIs normales
  moderate: {
    windowMs: 15 * 60 * 1000,    // 15 minutos
    maxRequests: 100,            // 100 requests por ventana
    blockDurationMs: 15 * 60 * 1000, // Bloqueo de 15 minutos
  },

  // Para APIs públicas
  lenient: {
    windowMs: 15 * 60 * 1000,    // 15 minutos
    maxRequests: 1000,           // 1000 requests por ventana
    blockDurationMs: 5 * 60 * 1000,  // Bloqueo de 5 minutos
  },
};

// Instancias de rate limiters
export const rateLimiters = {
  subscription: new RateLimiter(rateLimitConfigs.strict),
  billing: new RateLimiter(rateLimitConfigs.strict),
  user: new RateLimiter(rateLimitConfigs.moderate),
  public: new RateLimiter(rateLimitConfigs.lenient),
};

/**
 * Middleware helper para Next.js
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (identifier: string) => {
    const result = limiter.checkLimit(identifier);
    
    if (!result.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).rateLimitInfo = result;
      throw error;
    }

    return result;
  };
}

/**
 * Hook para usar rate limiting en API routes
 */
export function useRateLimit(request: Request, limiter: RateLimiter): RateLimitResult {
  // Usar IP como identificador
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

  return limiter.checkLimit(identifier);
}

/**
 * Utilidades para headers de rate limit
 */
export function addRateLimitHeaders(response: Response, result: RateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', String(rateLimitConfigs.moderate.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetTime));
  
  if (result.blocked && result.retryAfter) {
    response.headers.set('Retry-After', String(Math.ceil(result.retryAfter / 1000)));
  }
}

export type { RateLimitResult, RateLimitConfig };