/**
 * Página temporal para probar Address Element
 * Solo para verificar que funciona correctamente
 */

'use client';

import { StripeWrapper } from '../components/stripe/StripeWrapper';
import { StripeTest } from '../components/stripe/StripeTest';
import { AddressElementReadOnly } from '../components/stripe/AddressElementReadOnly';
import { PaymentElementWrapper } from '../components/stripe/PaymentElementWrapper';

export default function TestStripePage() {
  // Dirección de prueba española
  const testAddress = {
    country: 'ES',
    postalCode: '28001',
    city: 'Madrid',
    line1: 'Calle de Alcalá, 123',
    line2: '2º Izq',
    state: 'Madrid',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Stripe Elements</h1>
      
      <div className="space-y-8">
        {/* Test básico de carga */}
        <StripeWrapper>
          <StripeTest />
        </StripeWrapper>

        {/* Test Address Element */}
        <StripeWrapper>
          <AddressElementReadOnly 
            billingAddress={testAddress}
          />
        </StripeWrapper>

        {/* Test Payment Element */}
        <div>
          <h2 className="text-xl font-bold mb-4">Payment Element Test</h2>
          <PaymentElementWrapper 
            amount={2900} // €29.00
            currency="eur"
            onSuccess={() => {
              console.log('🎉 Payment test successful!');
              alert('¡Pago de prueba exitoso!');
            }}
            onError={(error) => {
              console.error('💥 Payment test failed:', error);
            }}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Página temporal</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Esta página es solo para testing. Se eliminará al completar la integración.
        </p>
        <p className="text-xs text-yellow-600 mt-2">
          Accede desde: http://localhost:3001/test-stripe
        </p>
      </div>
    </div>
  );
}