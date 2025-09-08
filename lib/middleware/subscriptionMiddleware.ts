/**
 * Middleware de control de acceso por suscripción
 * Verifica niveles de acceso basados en suscripciones activas
 * Integra con Clerk para autenticación y BD para suscripciones
 */

import { NextRequest } from 'next/server';
import { getUserSubscriptionForMiddleware } from './subscriptionService';

export type AccessLevel = 'OPEN' | 'FREE' | 'PREMIUM';

export interface RouteProtection {
  pattern: RegExp;
  requiredLevel: AccessLevel;
  description: string;
}

/**
 * Configuración de rutas protegidas por suscripción
 * Define qué nivel de acceso requiere cada ruta
 */
export const protectedRoutes: RouteProtection[] = [
  // Rutas OPEN - accesibles sin login (para SEO)
  {
    pattern: /^\/$/,
    requiredLevel: 'OPEN',
    description: 'Homepage - acceso público'
  },
  {
    pattern: /^\/cursos\/introduccion/,
    requiredLevel: 'OPEN', 
    description: 'Cursos introductorios - acceso público'
  },
  {
    pattern: /^\/about|\/contacto|\/privacy|\/terms/,
    requiredLevel: 'OPEN',
    description: 'Páginas institucionales - acceso público'
  },
  {
    pattern: /^\/test-subscription/,
    requiredLevel: 'OPEN',
    description: 'Página de prueba de suscripciones - acceso público para SEO'
  },
  
  // Rutas FREE - requieren login pero sin suscripción
  {
    pattern: /^\/web-dashboard$/,
    requiredLevel: 'FREE',
    description: 'Dashboard básico - usuarios registrados'
  },
  {
    pattern: /^\/web-dashboard\/profile/,
    requiredLevel: 'FREE',
    description: 'Perfil de usuario - usuarios registrados'
  },
  {
    pattern: /^\/cursos\/basicos/,
    requiredLevel: 'FREE',
    description: 'Cursos básicos - usuarios registrados'
  },
  
  // Rutas PREMIUM - requieren suscripción activa
  {
    pattern: /^\/web-dashboard\/billing/,
    requiredLevel: 'PREMIUM',
    description: 'Gestión de facturación - suscriptores premium'
  },
  {
    pattern: /^\/cursos\/avanzados/,
    requiredLevel: 'PREMIUM',
    description: 'Cursos avanzados - suscriptores premium'
  },
  {
    pattern: /^\/recursos\/premium/,
    requiredLevel: 'PREMIUM',
    description: 'Recursos premium - suscriptores premium'
  },
  {
    pattern: /^\/laboratorio/,
    requiredLevel: 'PREMIUM',
    description: 'Laboratorio virtual - suscriptores premium'
  }
];

/**
 * Determina el nivel de acceso requerido para una ruta
 */
export function getRequiredAccessLevel(pathname: string): AccessLevel | null {
  for (const route of protectedRoutes) {
    if (route.pattern.test(pathname)) {
      return route.requiredLevel;
    }
  }
  
  // Por defecto, las rutas no definidas requieren FREE (login)
  return 'FREE';
}

/**
 * Verifica si el usuario tiene acceso suficiente para una ruta
 * Versión optimizada para middleware que no usa Prisma directamente
 */
export async function checkSubscriptionAccess(
  clerkUserId: string,
  requiredLevel: AccessLevel,
  baseUrl: string
): Promise<{
  hasAccess: boolean;
  userLevel: AccessLevel;
  reason?: string;
}> {
  try {
    // Obtener estado de suscripción usando el servicio para middleware
    const subscriptionInfo = await getUserSubscriptionForMiddleware(clerkUserId, baseUrl);
    
    const userLevel = subscriptionInfo.accessLevel;
    
    // Definir jerarquía de acceso: OPEN < FREE < PREMIUM
    const accessHierarchy: Record<AccessLevel, number> = {
      'OPEN': 0,
      'FREE': 1, 
      'PREMIUM': 2
    };
    
    const userLevelValue = accessHierarchy[userLevel];
    const requiredLevelValue = accessHierarchy[requiredLevel];
    
    const hasAccess = userLevelValue >= requiredLevelValue;
    
    let reason: string | undefined;
    if (!hasAccess) {
      if (requiredLevel === 'FREE' && userLevel === 'OPEN') {
        reason = 'Se requiere iniciar sesión';
      } else if (requiredLevel === 'PREMIUM' && userLevel !== 'PREMIUM') {
        reason = 'Se requiere suscripción Premium';
      }
    }
    
    return {
      hasAccess,
      userLevel,
      reason
    };
    
  } catch (error) {
    console.error('❌ Error checking subscription access:', error);
    
    // En caso de error, denegar acceso por seguridad
    return {
      hasAccess: false,
      userLevel: 'OPEN',
      reason: 'Error verificando acceso'
    };
  }
}

/**
 * Genera URL de redirección según el nivel de acceso requerido
 */
export function getRedirectUrl(requiredLevel: AccessLevel, currentPath: string): string {
  switch (requiredLevel) {
    case 'FREE':
      return `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`;
    case 'PREMIUM':
      return `/web-dashboard/billing?upgrade=true&redirect_url=${encodeURIComponent(currentPath)}`;
    default:
      return '/';
  }
}

/**
 * Middleware helper para verificar acceso basado en suscripción
 * Se usa junto con clerkMiddleware para autenticación + suscripción
 */
export async function subscriptionMiddleware(
  request: NextRequest,
  clerkUserId: string | null
): Promise<{
  shouldRedirect: boolean;
  redirectUrl?: string;
  accessInfo?: {
    requiredLevel: AccessLevel;
    userLevel: AccessLevel;
    hasAccess: boolean;
    reason?: string;
  };
}> {
  const pathname = request.nextUrl.pathname;
  
  // Determinar nivel de acceso requerido
  const requiredLevel = getRequiredAccessLevel(pathname);
  
  if (!requiredLevel) {
    // Ruta no definida, permitir acceso por defecto
    return { shouldRedirect: false };
  }
  
  // Las rutas OPEN siempre son accesibles
  if (requiredLevel === 'OPEN') {
    return { shouldRedirect: false };
  }
  
  // Si requiere login pero no hay usuario autenticado
  if (!clerkUserId && (requiredLevel === 'FREE' || requiredLevel === 'PREMIUM')) {
    return {
      shouldRedirect: true,
      redirectUrl: getRedirectUrl(requiredLevel, pathname)
    };
  }
  
  // Si hay usuario autenticado, verificar nivel de suscripción
  if (clerkUserId) {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const accessCheck = await checkSubscriptionAccess(clerkUserId, requiredLevel, baseUrl);
    
    if (!accessCheck.hasAccess) {
      return {
        shouldRedirect: true,
        redirectUrl: getRedirectUrl(requiredLevel, pathname),
        accessInfo: {
          requiredLevel,
          userLevel: accessCheck.userLevel,
          hasAccess: accessCheck.hasAccess,
          reason: accessCheck.reason
        }
      };
    }
  }
  
  return { shouldRedirect: false };
}