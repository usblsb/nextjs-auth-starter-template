/**
 * Calculadora de precios en tiempo real
 * Muestra precios con impuestos y comparaciones entre planes
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { isCanaryIslandsPostalCode } from '@/lib/services/taxService';
import type { BillingPlan } from '@/lib/stripe/types';

interface PriceCalculatorProps {
  plans: BillingPlan[];
  selectedPlan?: BillingPlan;
  onPlanChange?: (plan: BillingPlan) => void;
  className?: string;
}

interface TaxInfo {
  rate: number;
  description: string;
  isCanaryIslands: boolean;
}

interface PlanComparison {
  plan: BillingPlan;
  pricing: {
    basePrice: number;
    taxAmount: number;
    totalPrice: number;
    monthlyEquivalent?: number;
  };
  savings?: {
    amount: number;
    percentage: number;
    comparedTo: string;
  };
  isRecommended?: boolean;
}

export function PriceCalculator({
  plans,
  selectedPlan,
  onPlanChange,
  className = '',
}: PriceCalculatorProps) {
  const [postalCode, setPostalCode] = useState('28001'); // Default Madrid
  const [taxInfo, setTaxInfo] = useState<TaxInfo>({
    rate: 0.21,
    description: 'IVA (España Continental)',
    isCanaryIslands: false,
  });
  const [showComparison, setShowComparison] = useState(false);

  // Calcular información fiscal basada en código postal
  useEffect(() => {
    if (!postalCode || postalCode.length < 5) return;

    const isCanary = isCanaryIslandsPostalCode(postalCode);
    setTaxInfo({
      rate: isCanary ? 0.07 : 0.21,
      description: isCanary ? 'IGIC (Islas Canarias)' : 'IVA (España Continental)',
      isCanaryIslands: isCanary,
    });
  }, [postalCode]);

  // Calcular comparaciones de precios
  const planComparisons = useMemo((): PlanComparison[] => {
    if (!plans.length) return [];

    const paidPlans = plans.filter(p => p.price > 0);
    const monthlyPlans = paidPlans.filter(p => p.interval === 'month');
    const yearlyPlans = paidPlans.filter(p => p.interval === 'year');

    return paidPlans.map(plan => {
      const basePrice = plan.price;
      const taxAmount = basePrice * taxInfo.rate;
      const totalPrice = basePrice + taxAmount;
      const monthlyEquivalent = plan.interval === 'year' ? totalPrice / 12 : totalPrice;

      const comparison: PlanComparison = {
        plan,
        pricing: {
          basePrice,
          taxAmount,
          totalPrice,
          monthlyEquivalent,
        },
      };

      // Calcular ahorros para planes anuales
      if (plan.interval === 'year') {
        // Buscar equivalente mensual
        const monthlyEquivalentPlan = monthlyPlans.find(mp => 
          mp.name.toLowerCase().includes('premium') && plan.name.toLowerCase().includes('premium')
        );

        if (monthlyEquivalentPlan) {
          const monthlyTotal = (monthlyEquivalentPlan.price * (1 + taxInfo.rate)) * 12;
          const annualSaving = monthlyTotal - totalPrice;
          
          comparison.savings = {
            amount: annualSaving,
            percentage: (annualSaving / monthlyTotal) * 100,
            comparedTo: monthlyEquivalentPlan.name,
          };
        }
      }

      // Marcar plan recomendado (generalmente el anual con descuento)
      comparison.isRecommended = plan.interval === 'year' && !!comparison.savings;

      return comparison;
    });
  }, [plans, taxInfo]);

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 5) {
      setPostalCode(value);
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(price);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuración fiscal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Configuración Fiscal Española
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-xs font-medium text-blue-800 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="28001"
                  maxLength={5}
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">{taxInfo.description}</span>
                  <span className="block text-blue-600">
                    Tipo: {(taxInfo.rate * 100).toFixed(0)}%
                    {taxInfo.isCanaryIslands && ' 🏝️'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparador de planes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Comparador de Precios
          </h3>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showComparison ? 'Vista Simple' : 'Comparar Todos'}
          </button>
        </div>

        <div className={`grid gap-4 ${
          showComparison 
            ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {planComparisons.map((comparison) => (
            <div
              key={comparison.plan.id}
              className={`relative border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                selectedPlan?.id === comparison.plan.id
                  ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              } ${comparison.isRecommended ? 'ring-2 ring-green-200 border-green-300' : ''}`}
              onClick={() => onPlanChange?.(comparison.plan)}
            >
              {/* Badge recomendado */}
              {comparison.isRecommended && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    ⭐ Recomendado
                  </span>
                </div>
              )}

              <div className="text-center">
                <h4 className="font-semibold text-lg text-gray-900 mb-2">
                  {comparison.plan.name}
                </h4>
                
                {comparison.plan.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {comparison.plan.description}
                  </p>
                )}

                {/* Precio principal */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(comparison.pricing.totalPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    por {comparison.plan.interval === 'month' ? 'mes' : 'año'}
                  </div>
                  
                  {comparison.plan.interval === 'year' && comparison.pricing.monthlyEquivalent && (
                    <div className="text-sm text-blue-600 mt-1">
                      {formatPrice(comparison.pricing.monthlyEquivalent)}/mes
                    </div>
                  )}
                </div>

                {/* Desglose de precios */}
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Base:</span>
                    <span>{formatPrice(comparison.pricing.basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{taxInfo.description}:</span>
                    <span>{formatPrice(comparison.pricing.taxAmount)}</span>
                  </div>
                </div>

                {/* Ahorros */}
                {comparison.savings && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <div className="text-sm font-medium text-green-800">
                      ¡Ahorra {formatPrice(comparison.savings.amount)}!
                    </div>
                    <div className="text-xs text-green-600">
                      {comparison.savings.percentage.toFixed(0)}% menos que el plan mensual
                    </div>
                  </div>
                )}

                {/* Estado de selección */}
                <div className="flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                    selectedPlan?.id === comparison.plan.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan?.id === comparison.plan.id && (
                      <svg className="w-2 h-2 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {selectedPlan?.id === comparison.plan.id ? 'Seleccionado' : 'Seleccionar'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      {taxInfo.isCanaryIslands && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5 text-orange-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <span className="font-medium text-orange-800">
                🏝️ Código postal de Canarias detectado
              </span>
              <p className="text-orange-700 mt-1">
                Se aplicará IGIC del 7% en lugar de IVA del 21%. 
                Los precios mostrados ya incluyen el descuento fiscal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        * Todos los precios incluyen los impuestos correspondientes según tu ubicación.
        Los precios pueden variar según las actualizaciones fiscales.
      </div>
    </div>
  );
}