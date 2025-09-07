/**
 * Servicio de gestión fiscal para España
 * Detecta automáticamente IVA (21%) vs IGIC (7%) según ubicación
 */

import { stripeConfig } from '@/lib/stripe/config';
import { stripe } from '@/lib/stripe/client';
import type { CustomerTaxInfo, TaxConfiguration } from '@/lib/stripe/types';

// ID del Tax Rate para IGIC Canarias (se configurará en Stripe Dashboard)
const IGIC_TAX_RATE_ID = 'txr_canary_islands_igic_7'; // Placeholder

/**
 * Detecta si un código postal pertenece a las Islas Canarias
 */
export function isCanaryIslandsPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  
  const { postalCodes } = stripeConfig.tax.canaryIslands;
  return postalCodes.lasPalmas.test(postalCode) || 
         postalCodes.santaCruz.test(postalCode);
}

/**
 * Determina la configuración fiscal según la dirección del cliente
 */
export function determineTaxConfiguration(address: {
  country: string;
  postalCode?: string;
}): CustomerTaxInfo {
  const { country, postalCode } = address;
  
  // Solo aplicamos lógica especial para España
  if (country !== 'ES') {
    return {
      country,
      postalCode,
      isCanaryIslands: false,
      region: 'mainland',
      taxConfig: {
        type: 'automatic',
        description: 'EU VAT via Stripe Tax',
      },
    };
  }
  
  // España: Verificar si es Canarias
  const isCanaryIslands = postalCode ? isCanaryIslandsPostalCode(postalCode) : false;
  
  if (isCanaryIslands) {
    // Canarias: IGIC 7% (manual via Tax Rates)
    return {
      country,
      postalCode,
      isCanaryIslands: true,
      region: 'canary_islands',
      taxConfig: {
        type: 'manual',
        rate: stripeConfig.tax.canaryIslands.igicRate,
        description: stripeConfig.tax.canaryIslands.description,
        taxRateId: IGIC_TAX_RATE_ID,
      },
    };
  } else {
    // España Continental: IVA 21% (automático via Stripe Tax)
    return {
      country,
      postalCode,
      isCanaryIslands: false,
      region: 'mainland',
      taxConfig: {
        type: 'automatic',
        rate: stripeConfig.tax.spain.vatRate,
        description: stripeConfig.tax.spain.description,
      },
    };
  }
}

/**
 * Crea o actualiza Tax Rate para IGIC en Stripe
 */
export async function ensureIgicTaxRate(): Promise<string> {
  try {
    // Buscar si ya existe el Tax Rate para IGIC
    const taxRates = await stripe.taxRates.list({
      limit: 100,
    });
    
    const existingIgicRate = taxRates.data.find(
      rate => rate.metadata?.type === 'igic' && rate.percentage === 7
    );
    
    if (existingIgicRate) {
      console.log('✅ IGIC Tax Rate ya existe:', existingIgicRate.id);
      return existingIgicRate.id;
    }
    
    // Crear nuevo Tax Rate para IGIC
    const newTaxRate = await stripe.taxRates.create({
      display_name: 'IGIC',
      description: 'Impuesto General Indirecto Canario (7%)',
      jurisdiction: 'ES',
      percentage: 7.0,
      inclusive: false,
      metadata: {
        type: 'igic',
        region: 'canary_islands',
        country: 'ES',
      },
    });
    
    console.log('✅ IGIC Tax Rate creado:', newTaxRate.id);
    return newTaxRate.id;
    
  } catch (error) {
    console.error('❌ Error creando IGIC Tax Rate:', error);
    throw error;
  }
}

/**
 * Aplica la configuración fiscal a una suscripción de Stripe
 */
export async function applyTaxToSubscription(
  subscriptionData: any,
  taxInfo: CustomerTaxInfo
): Promise<any> {
  
  if (taxInfo.taxConfig.type === 'automatic') {
    // Para IVA España Continental y otros países, Stripe Tax se encarga automáticamente
    return {
      ...subscriptionData,
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        ...subscriptionData.metadata,
        tax_region: taxInfo.region,
        tax_type: 'automatic_vat',
      },
    };
  } else if (taxInfo.taxConfig.type === 'manual' && taxInfo.isCanaryIslands) {
    // Para IGIC Canarias, aplicamos Tax Rate manual
    const igicTaxRateId = await ensureIgicTaxRate();
    
    return {
      ...subscriptionData,
      default_tax_rates: [igicTaxRateId],
      metadata: {
        ...subscriptionData.metadata,
        tax_region: taxInfo.region,
        tax_type: 'manual_igic',
        tax_rate_id: igicTaxRateId,
      },
    };
  }
  
  return subscriptionData;
}

/**
 * Obtiene información fiscal de un customer de Stripe existente
 */
export async function getCustomerTaxInfo(customerId: string): Promise<CustomerTaxInfo | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return null;
    }
    
    const address = customer.address;
    if (!address?.country) {
      return null;
    }
    
    return determineTaxConfiguration({
      country: address.country,
      postalCode: address.postal_code || undefined,
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo info fiscal del customer:', error);
    return null;
  }
}

/**
 * Calcula el precio total incluyendo impuestos
 */
export function calculateTotalWithTax(basePrice: number, taxInfo: CustomerTaxInfo): {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  taxRate: number;
} {
  const taxRate = taxInfo.taxConfig.rate || 0;
  const taxAmount = basePrice * taxRate;
  const totalPrice = basePrice + taxAmount;
  
  return {
    basePrice,
    taxAmount,
    totalPrice,
    taxRate,
  };
}