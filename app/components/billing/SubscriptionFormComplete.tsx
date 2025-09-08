/**
 * Formulario completo de suscripción con Address + Payment Elements
 * Un solo paso, todo integrado
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BillingPlan } from '@/lib/stripe/types';

interface SubscriptionFormCompleteProps {
  plan: BillingPlan;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack?: () => void;
}

interface TaxPreview {
  rate: number;
  description: string;
  amount: number;
  total: number;
}

export function SubscriptionFormComplete({
  plan,
  clientSecret,
  onSuccess,
  onError,
  onBack
}: SubscriptionFormCompleteProps) {
  const { user } = useUser();
  const stripe = useStripe();
  const elements = useElements();

  // Debug logs
  console.log('🔍 SubscriptionFormComplete renderizado:', {
    clientSecret: clientSecret ? 'PRESENT' : 'MISSING',
    stripe: stripe ? 'LOADED' : 'LOADING',
    elements: elements ? 'LOADED' : 'LOADING'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [addressComplete, setAddressComplete] = useState(false);
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [customerName, setCustomerName] = useState<{firstName: string, lastName: string} | null>(null);

  // Países permitidos (40 países)
  const allowedCountries = [
    'ES', // España
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE', // EU
    'US', 'CA', 'MX', // Norte América
    'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'VE', 'EC', 'BO', 'PY' // Sur América
  ];

  const handleAddressChange = async (event: any) => {
    const { complete, value } = event;
    setAddressComplete(complete);

    if (complete && value.address) {
      console.log('📍 Dirección completa, calculando impuestos:', value.address);
      
      // Guardar dirección para enviar al API después
      const addressData = {
        country: value.address.country,
        postalCode: value.address.postal_code,
        city: value.address.city,
        line1: value.address.line1,
        line2: value.address.line2 || '',
        state: value.address.state || '',
      };
      setBillingAddress(addressData);
      console.log('💾 Dirección guardada para billing:', addressData);
      
      // Guardar nombre del cliente si está disponible
      if (value.firstName || value.lastName) {
        const nameData = {
          firstName: value.firstName || '',
          lastName: value.lastName || ''
        };
        setCustomerName(nameData);
        console.log('👤 Nombre guardado:', nameData);
      }
      
      await calculateTax(value.address);
    }
  };

  const calculateTax = async (address: any) => {
    try {
      const response = await fetch('/api/stripe/tax-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingAddress: {
            country: address.country,
            postalCode: address.postal_code,
            city: address.city,
            line1: address.line1,
            line2: address.line2 || '',
            state: address.state || '',
          },
          amount: plan.price,
          currency: plan.currency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.taxPreview) {
        const taxAmount = plan.price * data.taxPreview.rate;
        const total = plan.price + taxAmount;
        
        setTaxPreview({
          rate: data.taxPreview.rate,
          description: data.taxPreview.description,
          amount: taxAmount,
          total: total,
        });

        console.log('💰 Tax calculado:', {
          base: plan.price,
          tax: taxAmount,
          total: total,
          rate: `${(data.taxPreview.rate * 100).toFixed(1)}%`
        });
      }
    } catch (error) {
      console.error('❌ Error calculando tax:', error);
      // Continuar sin tax si hay error
      setTaxPreview({
        rate: 0,
        description: 'Sin impuestos',
        amount: 0,
        total: plan.price,
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está cargado');
      return;
    }

    if (!addressComplete) {
      setError('Por favor completa tu dirección de facturación');
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
        
        // Crear suscripción
        await createSubscription(paymentIntent.id);
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

  const createSubscription = async (paymentIntentId: string) => {
    try {
      console.log('🔄 Creando suscripción desde payment:', {
        paymentIntentId,
        priceId: plan.stripePriceId,
        planName: plan.name,
        hasBillingAddress: !!billingAddress
      });
      
      const response = await fetch('/api/stripe/create-subscription-from-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          priceId: plan.stripePriceId,
          billingAddress: billingAddress, // ← Enviar dirección de facturación
          customerName: customerName, // ← Enviar nombre del cliente
        }),
      });

      const data = await response.json();
      
      console.log('📨 Respuesta del servidor:', {
        ok: response.ok,
        status: response.status,
        data
      });

      if (!response.ok) {
        console.error('❌ Respuesta de error:', data);
        throw new Error(data.error || data.message || 'Error creando suscripción');
      }

      console.log('🎉 Suscripción creada exitosamente:', data.subscriptionId);
      onSuccess();

    } catch (error) {
      console.error('❌ Error creando suscripción:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen del plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {plan.name}
            <div className="text-right">
              <div className="text-2xl font-bold">€{plan.price}</div>
              {taxPreview && (
                <div className="text-sm text-gray-600">
                  + €{taxPreview.amount.toFixed(2)} impuestos
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {plan.interval === 'month' ? 'Mensual' : 'Anual'} • Acceso completo a la plataforma
            {taxPreview && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="font-medium">Total: €{taxPreview.total.toFixed(2)}</div>
                <div className="text-xs text-blue-600">
                  {taxPreview.description} ({(taxPreview.rate * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address Element */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dirección de facturación</CardTitle>
            <CardDescription>
              Información para el cálculo de impuestos y facturación
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
                  name: user?.fullName || '',
                },
                display: {
                  name: 'split',
                },
              }}
              onChange={handleAddressChange}
            />
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
            {clientSecret ? (
              <PaymentElement />
            ) : (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Cargando Payment Element...</p>
              </div>
            )}
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
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={!stripe || loading || !addressComplete || !clientSecret}
            className="flex-1"
          >
            {loading ? 'Procesando...' : 
             !clientSecret ? 'Cargando...' :
             taxPreview ? `Pagar €${taxPreview.total.toFixed(2)}` : 
             `Pagar €${plan.price}`}
          </Button>
        </div>
      </form>

      {/* Security notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Pago seguro procesado por Stripe. Tu información está protegida.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          💳 Tarjeta test: 4242 4242 4242 4242
        </p>
      </div>
    </div>
  );
}