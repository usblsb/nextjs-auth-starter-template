/**
 * Cliente de Stripe para servidor
 * Configurado para el mercado español con gestión fiscal automática
 */

import Stripe from 'stripe';
import { stripeConfig } from './config';

// Cliente Stripe singleton para servidor
export const stripe = new Stripe(stripeConfig.secretKey!, {
  apiVersion: stripeConfig.apiVersion,
  typescript: true,
  telemetry: false, // Opcional: deshabilitar telemetría en desarrollo
});

// Función helper para obtener cliente con configuración específica
export function getStripeClient(options?: Partial<Stripe.StripeConfig>) {
  return new Stripe(stripeConfig.secretKey!, {
    apiVersion: stripeConfig.apiVersion,
    typescript: true,
    telemetry: false,
    ...options,
  });
}

// Validar conexión con Stripe
export async function validateStripeConnection() {
  try {
    const account = await stripe.accounts.retrieve();
    return {
      success: true,
      accountId: account.id,
      country: account.country,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  } catch (error) {
    console.error('❌ Error connecting to Stripe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default stripe;