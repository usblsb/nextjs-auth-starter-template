/**
 * Componente test para verificar que Stripe Elements carga correctamente
 */

'use client';

import { useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StripeTest() {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Stripe Elements</CardTitle>
        <CardDescription>Verificación de configuración</CardDescription>
      </CardHeader>
      <CardContent>
        {stripe && elements ? (
          <Alert>
            <AlertDescription className="text-green-600">
              ✅ Stripe Elements cargado correctamente
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ Error cargando Stripe Elements
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Stripe: {stripe ? 'Cargado' : 'No cargado'}</p>
          <p>Elements: {elements ? 'Cargado' : 'No cargado'}</p>
        </div>
      </CardContent>
    </Card>
  );
}