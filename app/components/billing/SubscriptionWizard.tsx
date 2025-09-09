/**
 * Wizard avanzado para proceso de suscripción
 * Flujo multi-paso con validación en tiempo real y UX optimizada
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { BillingAddressForm, type BillingAddress, type TaxPreview } from './BillingAddressForm';
import type { BillingPlan } from '@/lib/stripe/types';
import { withStripeRetry } from '@/lib/utils/retrySystem';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isAccessible: boolean;
}

interface SubscriptionWizardProps {
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
  savings?: {
    monthlyPrice: number;
    annualPrice: number;
    savedAmount: number;
    savedPercentage: number;
  };
}

type WizardStepId = 'plan' | 'address' | 'payment' | 'confirmation';

export function SubscriptionWizard({
  isOpen,
  onClose,
  plan,
  userEmail,
  onSuccess,
}: SubscriptionWizardProps) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<WizardStepId>('plan');
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [addressValid, setAddressValid] = useState(false);
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const email = userEmail || user?.primaryEmailAddress?.emailAddress || '';

  const steps: Record<WizardStepId, WizardStep> = {
    plan: {
      id: 'plan',
      title: 'Plan Seleccionado',
      description: 'Confirma tu elección',
      isCompleted: true,
      isAccessible: true,
    },
    address: {
      id: 'address',
      title: 'Dirección de Facturación',
      description: 'Completa tu información fiscal',
      isCompleted: addressValid && billingAddress !== null,
      isAccessible: true,
    },
    payment: {
      id: 'payment',
      title: 'Confirmación',
      description: 'Revisa y confirma tu suscripción',
      isCompleted: false,
      isAccessible: addressValid && billingAddress !== null,
    },
    confirmation: {
      id: 'confirmation',
      title: 'Procesando',
      description: 'Creando tu suscripción',
      isCompleted: false,
      isAccessible: false,
    },
  };

  const calculatePricing = useCallback(() => {
    if (!taxPreview) return;

    const basePrice = plan.price;
    const taxAmount = basePrice * taxPreview.rate;
    const totalPrice = basePrice + taxAmount;

    const pricing: PriceCalculation = {
      basePrice,
      taxAmount,
      totalPrice,
      currency: plan.currency,
      interval: plan.interval,
    };

    // Calcular ahorros para plan anual
    if (plan.interval === 'year') {
      const monthlyEquivalent = totalPrice / 12;
      const potentialMonthlyTotal = (basePrice / 10) * (1 + taxPreview.rate); // Estimación precio mensual
      const annualSavings = (potentialMonthlyTotal * 12) - totalPrice;
      
      pricing.savings = {
        monthlyPrice: potentialMonthlyTotal,
        annualPrice: totalPrice,
        savedAmount: annualSavings,
        savedPercentage: (annualSavings / (potentialMonthlyTotal * 12)) * 100,
      };
    }

    setPriceCalculation(pricing);
  }, [plan, taxPreview]);

  useEffect(() => {
    if (billingAddress && taxPreview && plan) {
      calculatePricing();
    }
  }, [billingAddress, taxPreview, plan, calculatePricing]);

  const handleAddressChange = (address: BillingAddress, isValid: boolean) => {
    setBillingAddress(address);
    setAddressValid(isValid);
  };

  const handleTaxInfoChange = (taxInfo: TaxPreview) => {
    setTaxPreview(taxInfo);
  };

  const handleNext = () => {
    const stepOrder: WizardStepId[] = ['plan', 'address', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: WizardStepId[] = ['plan', 'address', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!billingAddress || !email) {
      setError('Datos incompletos');
      return;
    }

    setCurrentStep('confirmation');
    setLoading(true);
    setError(null);
    setRetryCount(0);

    const subscriptionOperation = async () => {
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
            wizard_version: '3.0',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating subscription');
      }

      return await response.json();
    };

    try {
      const retryResult = await withStripeRetry(subscriptionOperation, {
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          console.log(`🔄 Retry ${attempt}: ${error.message}`);
        }
      });

      if (retryResult.success) {
        const data = retryResult.result;
        
        // Guardar dirección en base de datos
        await saveBillingAddress();
        
        console.log('✅ Subscription created successfully:', data.subscriptionId);
        onSuccess?.();
        onClose();
      } else {
        throw retryResult.error;
      }

    } catch (error) {
      console.error('❌ Subscription creation failed:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setCurrentStep('payment'); // Volver al paso de confirmación
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

  const getProgressPercentage = () => {
    const stepOrder: WizardStepId[] = ['plan', 'address', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return ((currentIndex + 1) / stepOrder.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Suscripción a {plan.name}
              </h2>
              <p className="text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700">
                Paso {Object.keys(steps).indexOf(currentStep) + 1} de {Object.keys(steps).length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(getProgressPercentage())}% completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {Object.entries(steps).map(([stepId, step], index) => (
                <div key={stepId} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentStep === stepId
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : step.isCompleted
                      ? 'bg-green-500 text-white'
                      : step.isAccessible
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.isCompleted ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < Object.keys(steps).length - 1 && (
                    <div className={`w-12 h-1 mx-2 rounded transition-all duration-200 ${
                      step.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {currentStep === 'plan' && (
              <div className="text-center py-8">
                <div className="bg-blue-50 p-6 rounded-lg inline-block">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">{plan.name}</h3>
                  <p className="text-blue-700 mb-4">{plan.description}</p>
                  <div className="text-3xl font-bold text-blue-900">
                    {plan.price} {plan.currency}
                    <span className="text-lg font-normal">/{plan.interval === 'month' ? 'mes' : 'año'}</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'address' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Facturación</h3>
                <BillingAddressForm
                  onAddressChange={handleAddressChange}
                  onTaxInfoChange={handleTaxInfoChange}
                  showTaxPreview={true}
                  className="mb-6"
                />
              </div>
            )}

            {currentStep === 'payment' && priceCalculation && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Resumen Final</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-md font-semibold mb-4">Detalles del Plan</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Plan {plan.name}</span>
                      <span>{priceCalculation.basePrice.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{taxPreview?.description}</span>
                      <span>{priceCalculation.taxAmount.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                    
                    {priceCalculation.savings && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Ahorro anual</span>
                        <span>-{priceCalculation.savings.savedAmount.toFixed(2)} {priceCalculation.currency}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{priceCalculation.totalPrice.toFixed(2)} {priceCalculation.currency}</span>
                    </div>
                    
                    {priceCalculation.savings && (
                      <p className="text-sm text-green-600 text-center">
                        ¡Ahorras {priceCalculation.savings.savedPercentage.toFixed(0)}% con el plan anual!
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold mb-3">Dirección de Facturación</h4>
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-2">Procesando tu suscripción</h3>
                <p className="text-gray-600 mb-4">Por favor espera mientras creamos tu suscripción...</p>
                
                {retryCount > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg inline-block">
                    <p className="text-yellow-800 text-sm">
                      Reintentando... (intento {retryCount})
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-4">No cierres esta ventana</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {currentStep !== 'confirmation' && (
            <div className="flex gap-3">
              {currentStep !== 'plan' && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
              )}
              
              <button
                onClick={currentStep === 'payment' ? handleConfirmSubscription : handleNext}
                disabled={
                  (currentStep === 'address' && !addressValid) ||
                  loading
                }
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 'payment' ? 'Confirmar Suscripción' : 'Continuar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}