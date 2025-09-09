/**
 * Tarjeta individual de plan de precios
 * Muestra información detallada del plan con precios incluyendo impuestos
 * Refactorizada con shadcn/ui components y diseño mobile-first
 */

'use client';

import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
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
    <Card className={`
      relative w-full transition-all duration-200 hover:shadow-lg
      ${isCurrentPlan 
        ? 'border-green-500 dark:border-green-400 bg-green-50/50 dark:bg-green-950/20' 
        : isRecommended 
        ? 'border-primary shadow-md' 
        : 'border-border hover:border-primary/30'
      }
    `}>
      {/* Badge recomendado */}
      {isRecommended && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="default" className="font-medium">
            Recomendado
          </Badge>
        </div>
      )}

      {/* Badge plan actual */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="secondary" className="border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            Plan Actual
          </Badge>
        </div>
      )}

      {/* Badge ahorro anual */}
      {plan.savings && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="destructive" className="text-xs font-medium bg-orange-500 hover:bg-orange-600">
            Ahorra {plan.savings.percentageOff}%
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg lg:text-xl font-bold">
          {plan.name}
        </CardTitle>
        {plan.description && (
          <CardDescription className="text-sm">
            {plan.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {/* Precio */}
        <div className="text-center mb-6">
          {isFree ? (
            <div className="text-3xl lg:text-4xl font-bold">
              Gratis
            </div>
          ) : (
            <div className="space-y-2">
              {/* Precio total */}
              <div className="text-3xl lg:text-4xl font-bold">
                {formatPrice(pricing.totalPrice)}
                <span className="text-base lg:text-lg font-normal text-muted-foreground">
                  /{getIntervalText(pricing.interval)}
                </span>
              </div>
              
              {/* Desglose de impuestos */}
              {pricing.taxAmount > 0 && (
                <div className="text-xs lg:text-sm text-muted-foreground">
                  Base: {formatPrice(pricing.basePrice)} + {formatPrice(pricing.taxAmount)} 
                  <span className="ml-1">
                    ({plan.taxInfo?.description || `${Math.round(pricing.taxRate * 100)}% impuestos`})
                  </span>
                </div>
              )}

              {/* Ahorro anual */}
              {plan.savings && (
                <div className="text-xs lg:text-sm text-green-600 dark:text-green-400 font-medium">
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
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Incluye:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span>
                  {feature === 'OPEN' && 'Acceso a contenido abierto'}
                  {feature === 'FREE' && 'Acceso a contenido gratuito'}
                  {feature === 'PREMIUM' && 'Acceso a contenido premium'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 px-6 pb-6">
        {/* Botón de acción */}
        <Button
          onClick={() => !isCurrentPlan && !isLoading && onSelect(plan)}
          disabled={isCurrentPlan || isLoading}
          variant={isCurrentPlan ? 'secondary' : isRecommended ? 'default' : isFree ? 'outline' : 'default'}
          size="lg"
          className={`
            w-full font-medium
            ${isCurrentPlan
              ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900'
              : ''
            }
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
        </Button>

        {/* Información adicional */}
        {!isFree && (
          <p className="text-xs text-muted-foreground text-center">
            Puedes cancelar en cualquier momento
          </p>
        )}
      </CardFooter>
    </Card>
  );
}