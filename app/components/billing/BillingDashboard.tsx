/**
 * Componente principal del Dashboard de Facturación
 * Integra todos los componentes de facturación y maneja el estado
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { SubscriptionStatus } from './SubscriptionStatus';
import { PricingPlans } from './PricingPlans';
import { BillingPortalButton } from './BillingPortalButton';
import { LoadingSpinner } from './LoadingSpinner';
import type { UserSubscriptionStatus, BillingPlan } from '@/lib/stripe/types';

interface BillingDashboardProps {
  userId: string;
}

export function BillingDashboard({ userId }: BillingDashboardProps) {
  const { user } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de suscripción y planes
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar estado de suscripción
        const statusResponse = await fetch('/api/stripe/subscription-status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!statusResponse.ok) {
          throw new Error('Error loading subscription status');
        }

        const statusData = await statusResponse.json();
        setSubscriptionStatus(statusData);

        // Cargar planes disponibles con información fiscal
        const plansResponse = await fetch('/api/stripe/plans', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setAvailablePlans(plansData.plans || []);
        }

      } catch (err) {
        console.error('Error loading billing data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadBillingData();
    }
  }, [userId]);

  // Manejar cambios de suscripción
  const handleSubscriptionChange = async () => {
    // Recargar datos después de cambios
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Cargando información de facturación...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error cargando datos de facturación
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No se pudo cargar la información de suscripción.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estado actual de suscripción */}
      <section>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estado de tu Suscripción
            </h2>
          </div>
          <div className="p-6">
            <SubscriptionStatus 
              subscription={subscriptionStatus}
              onSubscriptionChange={handleSubscriptionChange}
            />
          </div>
        </div>
      </section>

      {/* Portal de Stripe */}
      {subscriptionStatus.isSubscribed && (
        <section>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Portal de Facturación
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Gestiona tu método de pago, descarga facturas y actualiza tu información de facturación.
                </p>
              </div>
              <BillingPortalButton />
            </div>
          </div>
        </section>
      )}

      {/* Planes disponibles */}
      {!subscriptionStatus.isSubscribed && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {'Elige tu Plan'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona el plan que mejor se adapte a tus necesidades
            </p>
          </div>
          
          <PricingPlans
            plans={availablePlans}
            currentPlan={subscriptionStatus.currentPlan}
            userEmail={user?.primaryEmailAddress?.emailAddress}
            onSubscriptionChange={handleSubscriptionChange}
          />
        </section>
      )}

      {/* Información de acceso a contenido */}
      <section>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Tu Nivel de Acceso: {subscriptionStatus.accessLevel}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
                ✅ Contenido Accesible
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Contenido básico según tu plan</li>
              </ul>
            </div>
            
            {!subscriptionStatus.isSubscribed && (
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                  🔒 Contenido Premium
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Contenido premium disponible con suscripción</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  💡 Suscríbete para desbloquear este contenido
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}