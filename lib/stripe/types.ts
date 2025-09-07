/**
 * Tipos TypeScript para integración Stripe con sistema fiscal español
 */

import type Stripe from 'stripe';

// Tipos de configuración fiscal
export interface TaxConfiguration {
  type: 'automatic' | 'manual';
  rate?: number;
  description: string;
  taxRateId?: string; // Para Tax Rates manuales de Stripe
}

// Información fiscal del cliente
export interface CustomerTaxInfo {
  country: string;
  postalCode?: string;
  isCanaryIslands: boolean;
  taxConfig: TaxConfiguration;
  region: 'mainland' | 'canary_islands';
}

// Datos de suscripción con información fiscal
export interface SubscriptionWithTax extends Stripe.Subscription {
  taxInfo?: CustomerTaxInfo;
  billingCountry?: string;
  effectiveTaxRate?: number;
}

// Respuesta de creación de suscripción
export interface CreateSubscriptionResponse {
  success: boolean;
  subscription?: SubscriptionWithTax;
  clientSecret?: string;
  error?: string;
  taxInfo?: CustomerTaxInfo;
}

// Datos para crear suscripción
export interface CreateSubscriptionData {
  userId: string;
  priceId: string;
  email: string;
  billingAddress: {
    country: string;
    postalCode: string;
    city: string;
    line1: string;
    line2?: string;
    state?: string;
  };
  metadata?: Record<string, string>;
}

// Información del plan de facturación
export interface BillingPlan {
  id: string;
  name: string;
  description?: string;
  stripePriceId: string;
  stripeProductId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isActive: boolean;
}

// Estado de suscripción del usuario
export interface UserSubscriptionStatus {
  isSubscribed: boolean;
  status?: Stripe.Subscription.Status;
  currentPlan?: BillingPlan;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  accessLevel: 'OPEN' | 'FREE' | 'PREMIUM';
}

// Eventos de webhook de Stripe
export type StripeWebhookEvent = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated' 
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted';

// Payload de webhook procesado
export interface ProcessedWebhookEvent {
  eventType: StripeWebhookEvent;
  stripeEventId: string;
  customerId?: string;
  subscriptionId?: string;
  userId?: string; // ID de Clerk
  processed: boolean;
  error?: string;
  createdAt: Date;
}