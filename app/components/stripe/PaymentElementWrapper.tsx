/**
 * Wrapper para PaymentElement que maneja la creación del PaymentIntent
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { StripeWrapper } from './StripeWrapper';
import { PaymentElementBasic } from './PaymentElementBasic';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentElementWrapperProps {
  amount?: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentElementWrapper({ 
  amount = 2900, 
  currency = 'eur',
  onSuccess,
  onError 
}: PaymentElementWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating payment intent');
      }

      const data = await response.json();

      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
        console.log('💳 PaymentIntent created, client secret received');
      } else {
        throw new Error(data.error || 'Failed to get client secret');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error creating PaymentIntent:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [amount, currency, onError]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Preparando formulario de pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert>
        <AlertDescription>No se pudo crear el PaymentIntent</AlertDescription>
      </Alert>
    );
  }

  return (
    <StripeWrapper clientSecret={clientSecret}>
      <PaymentElementBasic
        amount={amount}
        currency={currency.toUpperCase()}
        onSuccess={onSuccess}
        onError={onError}
      />
    </StripeWrapper>
  );
}