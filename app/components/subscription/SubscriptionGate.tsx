/**
 * SubscriptionGate Component
 * Protege contenido específico basado en nivel de suscripción del usuario
 * Muestra mensajes de upgrade o login según sea necesario
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useSubscription } from '@/app/hooks/useSubscription';
import type { AccessLevel } from '@/lib/middleware/subscriptionMiddleware';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredLevel: AccessLevel;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
  loginMessage?: string;
  className?: string;
}

interface UpgradePromptProps {
  requiredLevel: AccessLevel;
  currentLevel: AccessLevel;
  customMessage?: string;
  showButton?: boolean;
}

function UpgradePrompt({ 
  requiredLevel, 
  currentLevel, 
  customMessage,
  showButton = true 
}: UpgradePromptProps) {
  const getUpgradeMessage = () => {
    if (customMessage) return customMessage;
    
    if (requiredLevel === 'FREE' && currentLevel === 'OPEN') {
      return 'Inicia sesión para acceder a este contenido gratuito';
    }
    
    if (requiredLevel === 'PREMIUM') {
      return 'Actualiza a Premium para acceder a este contenido exclusivo';
    }
    
    return 'Actualiza tu suscripción para acceder a este contenido';
  };

  const getActionButton = () => {
    if (requiredLevel === 'FREE' && currentLevel === 'OPEN') {
      return (
        <Link
          href="/sign-in"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Iniciar Sesión
        </Link>
      );
    }
    
    if (requiredLevel === 'PREMIUM') {
      return (
        <Link
          href="/web-dashboard/billing"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 border border-transparent rounded-md shadow-sm hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Actualizar a Premium
        </a>
      );
    }
    
    return null;
  };

  const getIcon = () => {
    if (requiredLevel === 'FREE') {
      return (
        <svg className="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      {getIcon()}
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Contenido {requiredLevel === 'PREMIUM' ? 'Premium' : 'Protegido'}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {getUpgradeMessage()}
      </p>
      
      {showButton && getActionButton()}
      
      {requiredLevel === 'PREMIUM' && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Contenido exclusivo
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sin publicidad
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Soporte prioritario
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente principal SubscriptionGate
 * Controla el acceso a contenido basado en suscripción
 */
export default function SubscriptionGate({
  children,
  requiredLevel,
  fallback,
  showUpgrade = true,
  upgradeMessage,
  loginMessage,
  className = ''
}: SubscriptionGateProps) {
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
  const { 
    subscription, 
    isLoading: isSubscriptionLoading, 
    error: subscriptionError 
  } = useSubscription();

  // Estado de carga
  if (!isUserLoaded || isSubscriptionLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Verificando acceso...</span>
      </div>
    );
  }

  // Error en la verificación de suscripción
  if (subscriptionError) {
    console.error('SubscriptionGate error:', subscriptionError);
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <p className="text-sm text-red-800">
          Error verificando acceso. Por favor, recarga la página.
        </p>
      </div>
    );
  }

  // Determinar nivel de acceso actual del usuario
  const getCurrentAccessLevel = (): AccessLevel => {
    if (!isSignedIn || !user) {
      return 'OPEN';
    }
    
    if (!subscription?.isSubscribed) {
      return 'FREE';
    }
    
    return subscription.accessLevel || 'FREE';
  };

  const currentLevel = getCurrentAccessLevel();
  
  // Verificar acceso según jerarquía: OPEN < FREE < PREMIUM
  const accessHierarchy: Record<AccessLevel, number> = {
    'OPEN': 0,
    'FREE': 1, 
    'PREMIUM': 2
  };
  
  const hasAccess = accessHierarchy[currentLevel] >= accessHierarchy[requiredLevel];

  // Si tiene acceso, mostrar contenido
  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // Si no tiene acceso, mostrar fallback o mensaje de upgrade
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (showUpgrade) {
    const message = requiredLevel === 'FREE' ? loginMessage : upgradeMessage;
    
    return (
      <div className={className}>
        <UpgradePrompt 
          requiredLevel={requiredLevel}
          currentLevel={currentLevel}
          customMessage={message}
        />
      </div>
    );
  }

  // Por defecto, no mostrar nada si no tiene acceso
  return null;
}