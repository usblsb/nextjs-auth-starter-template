/**
 * Formulario integrado Payment + Address Element
 * Para usar en el SubscriptionModal real
 */

'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BillingPlan } from '@/lib/stripe/types';
import type { BillingAddress } from './BillingAddressForm';

interface StripePaymentFormProps {
  plan: BillingPlan;
  billingAddress: BillingAddress;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onBack?: () => void;
}

export function StripePaymentForm({
  plan,
  billingAddress,
  clientSecret,
  onSuccess,
  onError,
  onBack
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Países permitidos (misma lista que antes)
  const allowedCountries = [
    'ES', // España
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE', // EU
    'US', 'CA', 'MX', // Norte América
    'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'VE', 'EC', 'BO', 'PY' // Sur América
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está cargado');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('💳 Procesando pago para suscripción:', plan.name);

    try {
      // Confirmar pago
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('El pago no se completó correctamente');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Payment error:', errorMessage);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen del plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {plan.name}
            <span className="text-2xl font-bold">€{plan.price}</span>
          </CardTitle>
          <CardDescription>
            Pago único • {plan.interval === 'month' ? 'Mensual' : 'Anual'}
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Element (solo lectura con datos del paso anterior) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dirección de facturación</CardTitle>
            <CardDescription>
              Información fiscal y de facturación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressElement
              options={{
                mode: 'billing',
                allowedCountries,
                fields: {
                  phone: 'never',
                },
                defaultValues: {
                  name: '', // Se llenará automáticamente
                  address: {
                    line1: billingAddress.line1,
                    line2: billingAddress.line2 || '',
                    city: billingAddress.city,
                    postal_code: billingAddress.postalCode,
                    country: billingAddress.country,
                    state: billingAddress.state || '',
                  },
                },
                display: {
                  name: 'split',
                },
              }}
              onChange={(event) => {
                console.log('📍 Address updated:', event.value);
              }}
            />
            
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              ℹ️ Si necesitas cambiar la dirección principal, regresa al paso anterior
            </div>
          </CardContent>
        </Card>

        {/* Payment Element */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de pago</CardTitle>
            <CardDescription>
              Pago seguro procesado por Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentElement />
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="flex-1"
            >
              Volver
            </Button>
          )}
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1"
          >
            {loading ? 'Procesando...' : `Pagar €${plan.price}`}
          </Button>
        </div>
      </form>

      {/* Security notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Pago seguro procesado por Stripe. Tu información está protegida.
        </p>
      </div>
    </div>
  );
}