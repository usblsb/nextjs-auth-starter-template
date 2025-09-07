/**
 * Componente de Planes de Precios
 * Muestra los planes disponibles con precios incluyendo impuestos españoles
 */

'use client';

import { useState } from 'react';
import { PricingCard } from './PricingCard';
import { LoadingSpinner } from './LoadingSpinner';
import type { BillingPlan } from '@/lib/stripe/types';

interface PricingPlansProps {
  plans: (BillingPlan & {
    pricing?: any;
    taxInfo?: any;
    isRecommended?: boolean;
    savings?: any;
  })[];
  currentPlan?: BillingPlan;
  userEmail?: string;
  onSubscriptionChange?: () => void;
}

export function PricingPlans({ 
  plans, 
  currentPlan, 
  userEmail,
  onSubscriptionChange 
}: PricingPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: BillingPlan) => {
    if (!userEmail) {
      console.error('User email not available');
      return;
    }

    // Skip free plan (no subscription needed)
    if (plan.price === 0) {
      console.log('Free plan selected - no action needed');
      return;
    }

    setLoadingPlan(plan.id);

    try {
      // Crear suscripción
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          email: userEmail,
          billingAddress: {
            country: 'ES',
            postalCode: '28001', // Default Madrid - el usuario puede cambiar en portal
            city: 'Madrid',
            line1: 'Dirección a completar',
          },
          metadata: {
            plan_name: plan.name,
            plan_id: plan.id,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creating subscription');
      }

      const data = await response.json();

      if (data.clientSecret) {
        // Redirigir a Stripe Checkout o manejar con Stripe Elements
        console.log('Subscription created, client secret:', data.clientSecret);
        
        // Por ahora, mostrar mensaje de éxito
        alert(`¡Suscripción creada! ID: ${data.subscriptionId}`);
        
        // Recargar estado
        onSubscriptionChange?.();
      }

    } catch (error) {
      console.error('Error creating subscription:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No hay planes disponibles en este momento.
        </p>
      </div>
    );
  }

  // Separar plan gratuito de los de pago
  const freePlan = plans.find(plan => plan.price === 0);
  const paidPlans = plans.filter(plan => plan.price > 0);

  return (
    <div className="space-y-6">
      {/* Información fiscal */}
      {plans.length > 0 && plans[0].taxInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Fiscalidad Española:</strong> {plans[0].taxInfo.description}
              {plans[0].taxInfo.isCanaryIslands && (
                <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                  🏝️ Islas Canarias
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid de planes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Plan gratuito */}
        {freePlan && (
          <PricingCard
            plan={freePlan}
            isCurrentPlan={currentPlan?.id === freePlan.id}
            isLoading={loadingPlan === freePlan.id}
            onSelect={handleSelectPlan}
            buttonText={
              currentPlan?.id === freePlan.id 
                ? 'Plan Actual' 
                : 'Plan Gratuito'
            }
          />
        )}

        {/* Planes de pago */}
        {paidPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlan?.id === plan.id}
            isRecommended={plan.isRecommended}
            isLoading={loadingPlan === plan.id}
            onSelect={handleSelectPlan}
            buttonText={
              currentPlan?.id === plan.id
                ? 'Plan Actual'
                : loadingPlan === plan.id
                ? 'Procesando...'
                : 'Seleccionar Plan'
            }
          />
        ))}
      </div>

      {/* Información adicional */}
      <div className="mt-8 text-center">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            ¿Necesitas ayuda?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                💳 Métodos de Pago
              </div>
              <p>Tarjeta de crédito/débito, transferencia bancaria SEPA</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                🔄 Cambios de Plan
              </div>
              <p>Puedes cambiar o cancelar en cualquier momento</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                📧 Soporte
              </div>
              <p>Contacta con nuestro equipo si tienes dudas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}