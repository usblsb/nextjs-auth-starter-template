/**
 * API Endpoint: Obtener planes de facturación disponibles
 * GET /api/stripe/plans
 * 
 * Retorna todos los planes disponibles con información de precios
 * incluyendo preview de impuestos según ubicación del usuario
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAvailablePlans } from '@/lib/services/billingService';
import { determineTaxConfiguration, calculateTotalWithTax } from '@/lib/services/taxService';

export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación (opcional para planes públicos)
    const { userId } = await auth();

    // 2. Obtener parámetros de query para cálculo de impuestos
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'ES';
    const postalCode = searchParams.get('postalCode');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    console.log(`📋 Getting billing plans (country: ${country}, postalCode: ${postalCode || 'none'})`);

    // 3. Obtener planes desde BD
    const plans = await getAvailablePlans();

    if (plans.length === 0) {
      return NextResponse.json(
        { 
          success: true,
          plans: [],
          message: 'No billing plans configured yet'
        },
        { status: 200 }
      );
    }

    // 4. Detectar configuración fiscal
    const taxInfo = determineTaxConfiguration({
      country,
      postalCode: postalCode || undefined,
    });

    // 5. Enriquecer planes con información de impuestos
    const plansWithTax = plans.map(plan => {
      const taxCalculation = calculateTotalWithTax(plan.price, taxInfo);
      
      return {
        ...plan,
        pricing: {
          basePrice: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          ...taxCalculation,
        },
        taxInfo: {
          region: taxInfo.region,
          description: taxInfo.taxConfig.description,
          rate: taxInfo.taxConfig.rate || 0,
          isCanaryIslands: taxInfo.isCanaryIslands,
        },
        isRecommended: plan.id === 'premium', // Marcar plan recomendado
        savings: plan.id === 'premium_annual' ? {
          monthsFree: 2,
          percentageOff: 17,
          annualSavings: (29 * 12) - plan.price,
        } : null,
      };
    });

    // 6. Filtrar planes inactivos si no se solicitan específicamente
    const filteredPlans = includeInactive 
      ? plansWithTax 
      : plansWithTax.filter(plan => plan.isActive);

    // 7. Ordenar planes: FREE, PREMIUM, PREMIUM_ANNUAL
    const sortedPlans = filteredPlans.sort((a, b) => {
      const order = { 'free': 0, 'premium': 1, 'premium_annual': 2 };
      return (order[a.id as keyof typeof order] || 999) - (order[b.id as keyof typeof order] || 999);
    });

    // 8. Respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        plans: sortedPlans,
        taxInfo: {
          region: taxInfo.region,
          description: taxInfo.taxConfig.description,
          country: taxInfo.country,
          postalCode: postalCode || null,
          isCanaryIslands: taxInfo.isCanaryIslands,
        },
        metadata: {
          totalPlans: sortedPlans.length,
          currency: 'EUR',
          userId: userId || null,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in plans endpoint:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'An error occurred while fetching billing plans'
      },
      { status: 500 }
    );
  }
}