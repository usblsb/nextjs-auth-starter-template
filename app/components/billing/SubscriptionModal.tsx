/**
 * Modal completo para proceso de suscripción
 * Incluye selección de plan, captura de dirección y preview de precios
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { StripeWrapper } from '../stripe/StripeWrapper';
import { SubscriptionFormComplete } from './SubscriptionFormComplete';
import type { BillingPlan } from '@/lib/stripe/types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BillingPlan;
  userEmail?: string;
  onSuccess?: () => void;
}


export function SubscriptionModal({
  isOpen,
  onClose,
  plan,
  userEmail,
  onSuccess,
}: SubscriptionModalProps) {
  const { user } = useUser();
  const [step, setStep] = useState<'loading' | 'form' | 'processing' | 'success'>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');

  const email = userEmail || user?.primaryEmailAddress?.emailAddress || '';

  const createPaymentIntent = useCallback(async () => {
    if (!email) {
      setError('Email requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💳 Creando Payment Intent para modal único');
      
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100, // En céntimos
          currency: plan.currency.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando Payment Intent');
      }

      setClientSecret(data.clientSecret);
      setStep('form');
      console.log('✅ Payment Intent creado:', data.paymentIntentId);
      console.log('🔑 Client Secret:', data.clientSecret ? 'OK' : 'MISSING');

    } catch (error) {
      console.error('❌ Error creando Payment Intent:', error);
      setError(error instanceof Error ? error.message : 'Error creando Payment Intent');
      setStep('form'); // Mostrar formulario aunque haya error
    } finally {
      setLoading(false);
    }
  }, [email, plan]);

  useEffect(() => {
    if (isOpen && plan) {
      createPaymentIntent();
    }
  }, [isOpen, plan, createPaymentIntent]);


  const handleFormSuccess = () => {
    console.log('🎉 Formulario completado exitosamente');
    setStep('success');
    onSuccess?.();
    
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFormError = (error: string) => {
    console.error('❌ Error en formulario:', error);
    setError(error);
  };


  const handleBack = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Suscripción a {plan.name}
              </h2>
              <p className="text-gray-600">
                {step === 'loading' && 'Preparando formulario...'}
                {step === 'form' && 'Completa tu suscripción'}
                {step === 'processing' && 'Procesando suscripción...'}
                {step === 'success' && '¡Suscripción creada exitosamente!'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="mb-8">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === 'form' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-4 ${
                  step === 'processing' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            {step === 'loading' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Preparando formulario...</p>
              </div>
            )}

            {step === 'form' && (
              <StripeWrapper clientSecret={clientSecret}>
                <SubscriptionFormComplete
                  plan={plan}
                  clientSecret={clientSecret || ''}
                  onSuccess={handleFormSuccess}
                  onError={handleFormError}
                  onBack={handleBack}
                />
              </StripeWrapper>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Procesando tu suscripción...</p>
                <p className="text-sm text-gray-500 mt-2">Creando tu acceso premium...</p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-2">¡Suscripción creada!</p>
                <p className="text-gray-600">Ya tienes acceso completo a la plataforma</p>
                <p className="text-sm text-gray-500 mt-2">Cerrando ventana...</p>
              </div>
            )}

            {error && step === 'loading' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
                <button 
                  onClick={() => setStep('form')} 
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Continuar de todos modos
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}