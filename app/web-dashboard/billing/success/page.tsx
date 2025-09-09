/**
 * Página de éxito después del pago con Stripe Checkout
 * Procesa la sesión y muestra confirmación al usuario
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export default function BillingSuccessPage() {
  const [result, setResult] = useState<SubscriptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const sessionId = searchParams.get('session_id');

  const processCheckoutSuccess = useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/checkout-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      setResult(data);

      // Si el proceso fue exitoso, invalidar cualquier caché de suscripción
      if (data.success) {
        // Limpiar localStorage si se usa para caché
        localStorage.removeItem('subscription_cache');
        localStorage.removeItem('user_subscription_status');
        
        // Disparar evento personalizado para notificar otros componentes
        window.dispatchEvent(new CustomEvent('subscription-updated'));
      }

    } catch (error) {
      console.error('Error processing checkout success:', error);
      setResult({
        success: false,
        error: 'Failed to process checkout success'
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setResult({ success: false, error: 'No session ID provided' });
      setLoading(false);
      return;
    }

    processCheckoutSuccess();
  }, [sessionId, processCheckoutSuccess]);

  const handleContinue = () => {
    // Refresco la página para asegurar que se recargue el estado de suscripción
    window.location.href = '/web-dashboard';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Procesando pago...</CardTitle>
            <CardDescription>
              Estamos confirmando tu suscripción
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>
            Ha ocurrido un error inesperado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (result.success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">
              ¡Suscripción Activada!
            </CardTitle>
            <CardDescription>
              Tu pago se ha procesado correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                ¡Gracias {user?.firstName}! Tu suscripción premium está ahora activa.
              </p>
              
              {result.subscriptionId && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">ID de Suscripción:</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border">
                    {result.subscriptionId}
                  </code>
                </div>
              )}

              {result.status && (
                <div className="flex justify-center mb-4">
                  <Badge variant={result.status === 'active' ? 'default' : 'secondary'}>
                    Estado: {result.status}
                  </Badge>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    ¿Qué sigue?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Accede a todo el contenido premium de la academia</li>
                      <li>Descarga recursos adicionales</li>
                      <li>Participa en sesiones exclusivas</li>
                      <li>Gestiona tu suscripción desde tu dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleContinue}
                className="flex-1"
              >
                Continuar al Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/web-dashboard/billing')}
                className="flex-1"
              >
                Ver Facturación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error case
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-red-600">
            Error en el Proceso
          </CardTitle>
          <CardDescription>
            Hubo un problema al procesar tu suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {result.error || 'Error desconocido'}
            </AlertDescription>
          </Alert>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ¿Qué puedes hacer?
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verifica tu email para confirmación de pago</li>
                    <li>Contacta con soporte si el problema persiste</li>
                    <li>Intenta nuevamente desde la página de facturación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={() => router.push('/web-dashboard/billing')}
              className="flex-1"
            >
              Volver a Facturación
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/web-dashboard')}
              className="flex-1"
            >
              Ir al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}