/**
 * Script para actualizar ambas suscripciones (mensual y anual)
 * Ejecutar: npx tsx scripts/update-both-subscriptions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔧 ACTUALIZA ESTOS IDs CON LOS REALES DE STRIPE:

// Plan Premium Mensual
const MONTHLY_PRICE_ID = 'price_XXXXXX_MONTHLY'; // ← Tu price ID mensual
const MONTHLY_PRODUCT_ID = 'prod_XXXXXX_MONTHLY'; // ← Tu product ID mensual

// Plan Premium Anual  
const ANNUAL_PRICE_ID = 'price_XXXXXX_ANNUAL'; // ← Tu price ID anual
const ANNUAL_PRODUCT_ID = 'prod_XXXXXX_ANNUAL'; // ← Tu product ID anual

async function updateBothSubscriptions() {
  console.log('🔧 Actualizando ambas suscripciones...\n');

  try {
    // 1. Actualizar suscripción mensual
    await prisma.userBillingPlan.update({
      where: { planKey: 'premium' },
      data: {
        stripePriceId: MONTHLY_PRICE_ID,
        stripeProductId: MONTHLY_PRODUCT_ID,
      },
    });
    console.log('✅ Plan Premium Mensual actualizado');

    // 2. Actualizar suscripción anual
    await prisma.userBillingPlan.update({
      where: { planKey: 'premium_annual' },
      data: {
        stripePriceId: ANNUAL_PRICE_ID,
        stripeProductId: ANNUAL_PRODUCT_ID,
      },
    });
    console.log('✅ Plan Premium Anual actualizado');

    // 3. Verificar actualizaciones
    const plans = await prisma.userBillingPlan.findMany({
      where: {
        planKey: {
          in: ['premium', 'premium_annual']
        }
      },
      orderBy: { price: 'asc' },
    });

    console.log('\n📊 Estado de suscripciones:');
    plans.forEach(plan => {
      const status = plan.stripePriceId.includes('XXXXXX') ? '❌ Pendiente' : '✅ Configurado';
      console.log(`  • ${plan.name}: ${plan.stripePriceId} ${status}`);
    });

    const allConfigured = plans.every(p => !p.stripePriceId.includes('XXXXXX'));
    
    if (allConfigured) {
      console.log('\n🎉 ¡Perfecto! Ambas suscripciones están configuradas.');
      console.log('Ya puedes probar el flujo de suscripción completo.');
    } else {
      console.log('\n⚠️ Recuerda actualizar los IDs reales en este script.');
    }

  } catch (error) {
    console.error('❌ Error actualizando suscripciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
updateBothSubscriptions();