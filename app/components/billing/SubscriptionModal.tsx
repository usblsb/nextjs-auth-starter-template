/**
 * Modal completo para proceso de suscripción
 * Incluye selección de plan, captura de dirección y preview de precios
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { BillingAddressForm, type BillingAddress, type TaxPreview } from './BillingAddressForm';
import type { BillingPlan } from '@/lib/stripe/types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: BillingPlan;
  userEmail?: string;
  onSuccess?: () => void;
}

interface PriceCalculation {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  currency: string;
  interval: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  plan,
  userEmail,
  onSuccess,
}: SubscriptionModalProps) {
  const { user } = useUser();
  const [step, setStep] = useState<'address' | 'confirm' | 'processing'>('address');
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [addressValid, setAddressValid] = useState(false);
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = userEmail || user?.primaryEmailAddress?.emailAddress || '';

  useEffect(() => {
    if (billingAddress && taxPreview && plan) {
      calculatePrice();
    }
  }, [billingAddress, taxPreview, plan]);

  const calculatePrice = () => {
    if (!taxPreview) return;

    const basePrice = plan.price;
    const taxAmount = basePrice * taxPreview.rate;
    const totalPrice = basePrice + taxAmount;

    setPriceCalculation({
      basePrice,
      taxAmount,
      totalPrice,
      currency: plan.currency,
      interval: plan.interval,
    });
  };

  const handleAddressChange = (address: BillingAddress, isValid: boolean) => {
    setBillingAddress(address);
    setAddressValid(isValid);
  };

  const handleTaxInfoChange = (taxInfo: TaxPreview) => {
    setTaxPreview(taxInfo);
  };

  const handleContinue = () => {
    if (step === 'address' && addressValid && billingAddress) {
      setStep('confirm');
    }
  };

  const handleConfirmSubscription = async () => {
    if (!billingAddress || !email) {
      setError('Datos incompletos');
      return;
    }

    setStep('processing');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          email: email,
          billingAddress: {
            country: billingAddress.country,
            postalCode: billingAddress.postalCode,
            city: billingAddress.city,
            line1: billingAddress.line1,
            line2: billingAddress.line2,
            state: billingAddress.state,
          },
          metadata: {
            plan_name: plan.name,
            plan_id: plan.id,
            user_id: user?.id,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating subscription');
      }

      const data = await response.json();

      if (data.success) {
        // Guardar dirección en base de datos
        await saveBillingAddress();
        
        console.log('✅ Subscription created successfully:', data.subscriptionId);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }

    } catch (error) {
      console.error('❌ Subscription error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setStep('confirm'); // Volver al paso de confirmación
    } finally {
      setLoading(false);
    }
  };

  const saveBillingAddress = async () => {
    if (!billingAddress || !user?.id) return;

    try {
      await fetch('/api/user/billing-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingAddress,
          clerkUserId: user.id,
        }),
      });
    } catch (error) {
      console.error('Error saving billing address:', error);
      // No bloquear el proceso si falla guardar la dirección
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('address');
    }
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
                {step === 'address' && 'Completa tu dirección de facturación'}
                {step === 'confirm' && 'Confirma tu suscripción'}
                {step === 'processing' && 'Procesando suscripción...'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={step === 'processing'}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'address' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-4 ${
                ['confirm', 'processing'].includes(step) ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'confirm' ? 'bg-blue-600 text-white' : 
                step === 'processing' ? 'bg-green-500 text-white' : 
                'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-4 ${
                step === 'processing' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            {step === 'address' && (
              <div>
                <BillingAddressForm
                  onAddressChange={handleAddressChange}
                  onTaxInfoChange={handleTaxInfoChange}
                  showTaxPreview={true}
                  className="mb-6"
                />
              </div>
            )}

            {step === 'confirm' && priceCalculation && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Resumen de suscripción</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{plan.name} ({plan.interval === 'month' ? 'mensual' : 'anual'})</span>
                      <span>{priceCalculation.basePrice.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>{taxPreview?.description}</span>
                      <span>{priceCalculation.taxAmount.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                    
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{priceCalculation.totalPrice.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Dirección de facturación</h3>
                  {billingAddress && (
                    <div className="text-sm text-gray-700">
                      <p>{billingAddress.line1}</p>
                      {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                      <p>{billingAddress.postalCode} {billingAddress.city}</p>
                      {billingAddress.state && <p>{billingAddress.state}</p>}
                      <p>España</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Procesando tu suscripción...</p>
                <p className="text-sm text-gray-500 mt-2">No cierres esta ventana</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {step !== 'processing' && (
            <div className="flex gap-3">
              {step === 'confirm' && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
              )}
              
              <button
                onClick={step === 'address' ? handleContinue : handleConfirmSubscription}
                disabled={step === 'address' ? !addressValid : loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'address' ? 'Continuar' : 'Confirmar Suscripción'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}