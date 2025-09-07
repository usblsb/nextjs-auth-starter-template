/**
 * Tarjeta individual de plan de precios
 * Muestra información detallada del plan con precios incluyendo impuestos
 */

'use client';

import { LoadingSpinner } from './LoadingSpinner';
import type { BillingPlan } from '@/lib/stripe/types';

interface PricingCardProps {
  plan: BillingPlan & {
    pricing?: {
      basePrice: number;
      taxAmount: number;
      totalPrice: number;
      taxRate: number;
      currency: string;
      interval: string;
    };
    taxInfo?: {
      description: string;
      isCanaryIslands: boolean;
    };
    isRecommended?: boolean;
    savings?: {
      monthsFree: number;
      percentageOff: number;
      annualSavings: number;
    };
  };
  isCurrentPlan?: boolean;
  isRecommended?: boolean;
  isLoading?: boolean;
  buttonText?: string;
  onSelect: (plan: BillingPlan) => void;
}

export function PricingCard({
  plan,
  isCurrentPlan = false,
  isRecommended = false,
  isLoading = false,
  buttonText = 'Seleccionar Plan',
  onSelect,
}: PricingCardProps) {
  const isFree = plan.price === 0;
  const pricing = plan.pricing || {
    basePrice: plan.price,
    taxAmount: 0,
    totalPrice: plan.price,
    taxRate: 0,
    currency: plan.currency,
    interval: plan.interval,
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: pricing.currency.toUpperCase(),
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'month': return 'mes';
      case 'year': return 'año';
      default: return interval;
    }
  };

  return (
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 hover:shadow-lg
      ${isCurrentPlan 
        ? 'border-green-500 dark:border-green-400' 
        : isRecommended 
        ? 'border-blue-500 dark:border-blue-400' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }
    `}>
      {/* Badge recomendado */}
      {isRecommended && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Recomendado
          </span>
        </div>
      )}

      {/* Badge plan actual */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Plan Actual
          </span>
        </div>
      )}

      {/* Badge ahorro anual */}
      {plan.savings && (
        <div className="absolute -top-3 -right-3">
          <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Ahorra {plan.savings.percentageOff}%
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {plan.description}
            </p>
          )}
        </div>

        {/* Precio */}
        <div className="text-center mb-6">
          {isFree ? (
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              Gratis
            </div>
          ) : (
            <div className="space-y-1">
              {/* Precio total */}
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatPrice(pricing.totalPrice)}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                  /{getIntervalText(pricing.interval)}
                </span>
              </div>
              
              {/* Desglose de impuestos */}
              {pricing.taxAmount > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Base: {formatPrice(pricing.basePrice)} + {formatPrice(pricing.taxAmount)} 
                  <span className="ml-1">
                    ({plan.taxInfo?.description || `${Math.round(pricing.taxRate * 100)}% impuestos`})
                  </span>
                </div>
              )}

              {/* Ahorro anual */}
              {plan.savings && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Ahorras {formatPrice(plan.savings.annualSavings)} al año
                  <br />
                  <span className="text-xs">
                    ({plan.savings.monthsFree} meses gratis)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Características */}
        <div className="mb-6">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature === 'OPEN' && 'Acceso a contenido abierto'}
                {feature === 'FREE' && 'Acceso a contenido gratuito'}
                {feature === 'PREMIUM' && 'Acceso a contenido premium'}
              </li>
            ))}
          </ul>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => !isCurrentPlan && !isLoading && onSelect(plan)}
          disabled={isCurrentPlan || isLoading}
          className={`
            w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
            ${isCurrentPlan
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 cursor-default border border-green-300 dark:border-green-700'
              : isRecommended
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : isFree
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
            }
            ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Procesando...</span>
            </>
          ) : (
            buttonText
          )}
        </button>

        {/* Información adicional */}
        {!isFree && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Puedes cancelar en cualquier momento
          </p>
        )}
      </div>
    </div>
  );
}