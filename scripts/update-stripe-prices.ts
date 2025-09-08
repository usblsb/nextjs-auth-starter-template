/**
 * Script para actualizar los IDs de Stripe en la base de datos
 * Ejecutar: npx tsx scripts/update-stripe-prices.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ACTUALIZA ESTOS VALORES CON LOS IDs REALES DE STRIPE
const STRIPE_IDS = {
  // Producto Premium
  premium_product: 'prod_premium_placeholder', // ← Cambiar por ID real: prod_1XxxxxxxxxxxxxxxXXX
  premium_monthly: 'price_premium_placeholder', // ← Cambiar por ID real: price_1XxxxxxxxxxxxxxxXXX
  premium_annual: 'price_premium_annual_placeholder', // ← Cambiar por ID real (opcional)
  
  // Free plan (no necesita Stripe, pero mantener consistencia)
  free_product: 'prod_free_placeholder',
  free_price: 'price_free_placeholder',
};

async function updateStripePrices() {
  console.log('🔧 Actualizando IDs de Stripe en la base de datos...\n');

  try {
    // 1. Actualizar plan premium mensual
    if (STRIPE_IDS.premium_monthly !== 'price_premium_placeholder') {
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium' },
        data: {
          stripePriceId: STRIPE_IDS.premium_monthly,
          stripeProductId: STRIPE_IDS.premium_product,
        },
      });
      console.log('✅ Plan premium mensual actualizado');
    } else {
      console.log('⚠️  Plan premium mensual - ID placeholder, actualizar manualmente');
    }

    // 2. Actualizar plan premium anual (opcional)
    if (STRIPE_IDS.premium_annual !== 'price_premium_annual_placeholder') {
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium_annual' },
        data: {
          stripePriceId: STRIPE_IDS.premium_annual,
          stripeProductId: STRIPE_IDS.premium_product,
        },
      });
      console.log('✅ Plan premium anual actualizado');
    } else {
      console.log('⚠️  Plan premium anual - ID placeholder, actualizar manualmente');
    }

    // 3. Mostrar planes actualizados
    console.log('\n📊 Estado actual de los planes:');
    const plans = await prisma.userBillingPlan.findMany({
      orderBy: { price: 'asc' },
    });

    plans.forEach(plan => {
      const status = plan.stripePriceId.includes('placeholder') ? '❌ Placeholder' : '✅ Real';
      console.log(`  • ${plan.name}: ${plan.stripePriceId} ${status}`);
    });

    console.log('\n🎉 Actualización completada!');
    
    if (STRIPE_IDS.premium_monthly === 'price_premium_placeholder') {
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   1. Ve a Stripe Dashboard → Productos');
      console.log('   2. Crea el producto "Plan Premium" con precio €29.00/mes');
      console.log('   3. Copia los IDs reales en este script');
      console.log('   4. Ejecuta el script nuevamente');
    }

  } catch (error) {
    console.error('❌ Error actualizando IDs de Stripe:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
updateStripePrices()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });