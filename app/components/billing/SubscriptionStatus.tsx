/**
 * Componente de Estado de Suscripción
 * Muestra información detallada sobre la suscripción actual del usuario
 */

'use client';

import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { UserSubscriptionStatus } from '@/lib/stripe/types';

interface SubscriptionStatusProps {
  subscription: UserSubscriptionStatus;
  onSubscriptionChange?: () => void;
}

export function SubscriptionStatus({ subscription, onSubscriptionChange }: SubscriptionStatusProps) {
  const [cancelling, setCancelling] = useState(false);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No disponible';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'trialing': return 'text-blue-600 dark:text-blue-400';
      case 'past_due': return 'text-yellow-600 dark:text-yellow-400';
      case 'canceled': return 'text-red-600 dark:text-red-400';
      case 'unpaid': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'trialing': return 'En prueba';
      case 'past_due': return 'Pago pendiente';
      case 'canceled': return 'Cancelada';
      case 'unpaid': return 'Sin pagar';
      default: return 'Desconocido';
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription.currentPlan) return;

    const confirmCancel = confirm(
      '¿Estás seguro que quieres cancelar tu suscripción? ' +
      'Mantendrás el acceso hasta el final del período actual.'
    );

    if (!confirmCancel) return;

    setCancelling(true);

    try {
      // Obtener ID de suscripción desde BD
      const statusResponse = await fetch('/api/stripe/subscription-status');
      const statusData = await statusResponse.json();
      
      if (!statusData.success) {
        throw new Error('Error obteniendo información de suscripción');
      }

      // Buscar la suscripción activa
      // TODO: Implementar endpoint para obtener subscription ID
      // Por ahora, usamos un placeholder
      const subscriptionId = 'sub_placeholder';

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: true,
          reason: 'user_request',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error cancelando suscripción');
      }

      const data = await response.json();
      
      alert('Suscripción cancelada. Se mantendrá activa hasta: ' + formatDate(data.effectiveDate));
      
      // Recargar estado
      onSubscriptionChange?.();

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCancelling(false);
    }
  };

  if (!subscription.isSubscribed) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin suscripción activa
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Actualmente tienes acceso al contenido gratuito. Suscríbete para acceder al contenido premium.
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Nivel actual:</strong> {subscription.accessLevel}
          </p>
        </div>
      </div>
    );
  }

  // const currentSub = subscription.subscription!; // Comentado temporalmente para build

  return (
    <div className="space-y-6">
      {/* Estado principal */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado</div>
          <div className={`text-lg font-semibold ${getStatusColor(subscription.status || 'active')}`}>
            {getStatusText(subscription.status || 'active')}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plan Actual</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {subscription.currentPlan?.name}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Próximo Pago</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(subscription.currentPeriodEnd)}
          </div>
        </div>
      </div>

      {/* Detalles del plan */}
      {subscription.currentPlan && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Detalles del Plan
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-blue-700 dark:text-blue-300 mb-2">
                <strong>Precio:</strong> €{subscription.currentPlan.price}/{subscription.currentPlan.interval === 'month' ? 'mes' : 'año'}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                <strong>Moneda:</strong> {subscription.currentPlan.currency?.toUpperCase()}
              </div>
            </div>
            
            <div>
              <div className="text-blue-700 dark:text-blue-300 mb-2">
                <strong>Acceso a:</strong>
              </div>
              <div className="flex flex-wrap gap-1">
                {subscription.currentPlan.features?.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de estado */}
      {subscription.cancelAtPeriodEnd && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-yellow-800 dark:text-yellow-200">
              <strong>Suscripción programada para cancelación</strong>
              <p className="text-sm mt-1">
                Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}. 
                Mantendrás acceso hasta esa fecha.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscription.status === 'past_due' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-red-800 dark:text-red-200">
              <strong>Pago pendiente</strong>
              <p className="text-sm mt-1">
                Hay un problema con tu método de pago. Actualiza tu información de facturación para continuar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Gestión de Suscripción
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Puedes cancelar tu suscripción en cualquier momento
              </p>
            </div>
            
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {cancelling ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Cancelando...</span>
                </>
              ) : (
                'Cancelar Suscripción'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}