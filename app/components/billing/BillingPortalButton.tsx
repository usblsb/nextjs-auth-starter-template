/**
 * Botón para acceder al Portal de Facturación de Stripe
 * Permite a los usuarios gestionar su información de pago y facturas
 */

'use client';

import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface BillingPortalButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  returnUrl?: string;
  className?: string;
}

export function BillingPortalButton({
  variant = 'primary',
  size = 'md',
  returnUrl,
  className = '',
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: returnUrl || window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error accessing billing portal');
      }

      const data = await response.json();

      if (data.success && data.url) {
        // Abrir portal en nueva ventana
        window.open(data.url, '_blank');
      } else {
        throw new Error(data.message || 'No portal URL received');
      }

    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg
      focus:ring-blue-500 border border-transparent
    `,
    secondary: `
      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
      text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600
      focus:ring-blue-500 shadow-sm hover:shadow-md
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `;

  return (
    <div className="space-y-2">
      <button
        onClick={handleOpenPortal}
        disabled={loading}
        className={buttonClasses}
        aria-label="Abrir portal de facturación"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Abriendo portal...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
            Gestionar Facturación
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
        El portal se abrirá en una nueva ventana donde podrás:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Actualizar métodos de pago</li>
          <li>Descargar facturas</li>
          <li>Ver historial de pagos</li>
          <li>Actualizar información de facturación</li>
          <li>Gestionar suscripciones</li>
        </ul>
      </div>
    </div>
  );
}