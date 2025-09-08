/**
 * Wrapper básico para Stripe Elements
 * Configuración inicial limpia y funcional
 */

'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

// Usar STRIPE_API_KEY como clave pública según configuración del usuario  
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_API_KEY || '');

interface StripeWrapperProps {
  children: ReactNode;
  clientSecret?: string;
}

export function StripeWrapper({ children, clientSecret }: StripeWrapperProps) {
  // Configuración básica de apariencia compatible con shadcn/ui
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb', // blue-600 de Tailwind
      colorBackground: '#ffffff',
      colorText: '#1f2937', // gray-800
      colorDanger: '#dc2626', // red-600
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px', // Compatible con shadcn
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  // Solo renderizar Elements cuando tengamos clientSecret
  // Esto evita el error de clientSecret mutable
  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Preparando Stripe...</p>
      </div>
    );
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

export default StripeWrapper;