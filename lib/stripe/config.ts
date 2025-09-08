/**
 * Configuración centralizada de Stripe
 * Incluye configuración para fiscalidad española (IVA/IGIC)
 */

// Validar variables de entorno requeridas
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} as const;

// Verificar que todas las variables estén configuradas
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const stripeConfig = {
  // Claves API
  secretKey: requiredEnvVars.STRIPE_SECRET_KEY,
  publishableKey: requiredEnvVars.STRIPE_PUBLISHABLE_KEY,
  
  // Configuración webhook
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Configuración API
  apiVersion: '2025-08-27.basil' as const,
  
  // URLs del sistema
  urls: {
    success: '/web-dashboard/billing/success',
    cancel: '/web-dashboard/billing/cancel',
    portal: '/web-dashboard/billing/portal',
  },
  
  // Configuración fiscal española
  tax: {
    // IVA España Continental - via Stripe Tax (automático)
    spain: {
      country: 'ES',
      vatRate: 0.21, // 21%
      useStripeTax: true,
      description: 'IVA (España Continental)',
    },
    
    // IGIC Canarias - via Tax Rates (manual)
    canaryIslands: {
      country: 'ES',
      igicRate: 0.07, // 7%
      useStripeTax: false,
      description: 'IGIC (Islas Canarias)',
      // Códigos postales Canarias
      postalCodes: {
        lasPalmas: /^35\d{3}$/, // 35xxx
        santaCruz: /^38\d{3}$/, // 38xxx
      },
    },
  },
  
  // Configuración de productos (actualizaremos desde Stripe Dashboard)
  products: {
    free: {
      priceId: '', // Se configurará desde dashboard
      name: 'Plan Gratuito',
      features: ['OPEN', 'FREE'],
    },
    premium: {
      priceId: '', // Se configurará desde dashboard  
      name: 'Plan Premium',
      features: ['OPEN', 'FREE', 'PREMIUM'],
    },
  },
} as const;

// Tipos TypeScript
export type StripeConfig = typeof stripeConfig;
export type TaxRegion = 'spain' | 'canaryIslands';
export type UserAccessLevel = 'OPEN' | 'FREE' | 'PREMIUM';