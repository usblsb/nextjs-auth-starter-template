/**
 * Sección de Facturación para el Dashboard
 * Integra el BillingDashboard en la estructura existente del dashboard
 */

'use client';

import { BillingDashboard } from '@/app/components/billing/BillingDashboard';

interface BillingSectionProps {
  user: any;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

export default function BillingSection({
  user,
  onError,
  onLoading,
}: BillingSectionProps) {
  if (!user?.id) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          Error: No se pudo obtener la información del usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del usuario actual */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Usuario:</strong> {user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'No disponible'}
            </p>
            {user.firstName && (
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {user.firstName} {user.lastName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard de facturación */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <BillingDashboard userId={user.id} />
      </div>
    </div>
  );
}