/**
 * Payment Element básico
 * Solo para verificar que pide tarjeta correctamente
 */

'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentElementBasicProps {
  amount?: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentElementBasic({ 
  amount = 2900, // €29.00
  currency = 'EUR',
  onSuccess,
  onError 
}: PaymentElementBasicProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está cargado');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('💳 Submitting payment...');

    try {
      // Confirmar pago
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // No redirigir automáticamente
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        setSucceeded(true);
        onSuccess?.();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Payment error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription className="text-green-600">
              ✅ ¡Pago de {amount/100} {currency} realizado correctamente!
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Este es solo un test. En la integración real, aquí se crearía la suscripción.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago con tarjeta</CardTitle>
        <CardDescription>
          Test Payment Element - {amount/100} {currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Element - aquí debe aparecer el formulario de tarjeta */}
          <PaymentElement 
            options={{
              // Remover billingDetails: 'never' para evitar el error
              // En la integración real, usaremos los datos del AddressElement
            }}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={!stripe || loading}
            className="w-full"
          >
            {loading ? 'Procesando...' : `Pagar ${amount/100} ${currency}`}
          </Button>
        </form>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Usa tarjeta de test: 4242 4242 4242 4242</p>
          <p>• CVC: cualquier 3 dígitos</p>
          <p>• Fecha: cualquier fecha futura</p>
        </div>
      </CardContent>
    </Card>
  );
}