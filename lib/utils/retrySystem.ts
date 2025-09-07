/**
 * Sistema de retry automático para operaciones críticas
 * Maneja fallos transitorios y mejora la confiabilidad
 */

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;        // Delay base en ms
  maxDelay: number;         // Delay máximo en ms
  backoffMultiplier: number; // Multiplicador para backoff exponencial
  retryCondition?: (error: any) => boolean; // Función para determinar si hacer retry
  onRetry?: (attempt: number, error: any) => void; // Callback en cada retry
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

/**
 * Ejecuta una función con retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryCondition = (error) => !isNonRetryableError(error),
    onRetry,
  } = config;

  const startTime = Date.now();
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      return {
        success: true,
        result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
      
    } catch (error) {
      lastError = error;
      
      // Si es el último intento o el error no es reintentable
      if (attempt === maxAttempts || !retryCondition(error)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      }
      
      // Calcular delay con backoff exponencial
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      // Añadir jitter para evitar thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      onRetry?.(attempt, error);
      
      console.warn(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${jitteredDelay}ms:`, error instanceof Error ? error.message : String(error));
      
      await sleep(jitteredDelay);
    }
  }

  // Este punto no debería alcanzarse, pero por completitud
  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Determina si un error NO debería ser reintentado
 */
function isNonRetryableError(error: any): boolean {
  // Errores de autenticación/autorización
  if (error.status === 401 || error.status === 403) {
    return true;
  }
  
  // Errores de validación
  if (error.status === 400 || error.status === 422) {
    return true;
  }
  
  // Errores específicos de Stripe que no deberían reintentarse
  if (error.type === 'StripeInvalidRequestError') {
    return true;
  }
  
  // Errores de Clerk que no deberían reintentarse
  if (error.code && ['form_password_incorrect', 'form_identifier_not_found'].includes(error.code)) {
    return true;
  }
  
  return false;
}

/**
 * Utility function para sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Configuraciones predefinidas para diferentes tipos de operaciones
 */
export const retryConfigs = {
  // Para operaciones críticas (pagos, suscripciones)
  critical: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
  },
  
  // Para operaciones importantes (sync de datos)
  important: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  
  // Para operaciones normales
  normal: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
  },
};

/**
 * Wrapper especializado para operaciones de Stripe
 */
export async function withStripeRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  return withRetry(operation, {
    ...retryConfigs.critical,
    retryCondition: (error) => {
      // Retry en errores de red o temporales
      if (error.type === 'StripeConnectionError' || error.type === 'StripeAPIError') {
        return true;
      }
      
      // Retry en rate limiting
      if (error.statusCode === 429) {
        return true;
      }
      
      // No retry en errores de validación o configuración
      return !isNonRetryableError(error);
    },
    onRetry: (attempt, error) => {
      console.warn(`💳 Stripe retry ${attempt}:`, {
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
      });
    },
    ...config,
  });
}

/**
 * Wrapper especializado para operaciones de base de datos
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  return withRetry(operation, {
    ...retryConfigs.important,
    retryCondition: (error) => {
      // Retry en errores de conexión
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return true;
      }
      
      // Retry en errores temporales de Prisma
      if (error.code === 'P1001' || error.code === 'P1008') {
        return true;
      }
      
      return !isNonRetryableError(error);
    },
    onRetry: (attempt, error) => {
      console.warn(`🗄️ Database retry ${attempt}:`, {
        code: error.code,
        message: error.message,
      });
    },
    ...config,
  });
}

/**
 * Wrapper especializado para llamadas HTTP
 */
export async function withHttpRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  return withRetry(operation, {
    ...retryConfigs.normal,
    retryCondition: (error) => {
      // Retry en errores de red
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return true;
      }
      
      // Retry en errores 5xx del servidor
      if (error.status >= 500) {
        return true;
      }
      
      // Retry en 429 (rate limiting)
      if (error.status === 429) {
        return true;
      }
      
      return false;
    },
    onRetry: (attempt, error) => {
      console.warn(`🌐 HTTP retry ${attempt}:`, {
        status: error.status,
        code: error.code,
        url: error.config?.url,
      });
    },
    ...config,
  });
}

/**
 * Circuit breaker pattern para operaciones que fallan frecuentemente
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTime = 60000 // 1 minuto
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTime) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

export { CircuitBreaker };
export type { RetryConfig, RetryResult };