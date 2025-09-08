/**
 * Script rápido para actualizar precio con ID real de Stripe
 * Ejecutar: npx tsx scripts/quick-fix-price.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CAMBIA ESTOS POR LOS IDs REALES DE TU STRIPE DASHBOARD
const REAL_PRICE_ID = 'price_1234567890abcdef'; // ← Cambiar por tu precio real
const REAL_PRODUCT_ID = 'prod_1234567890abcdef'; // ← Cambiar por tu producto real

async function quickFixPrice() {
  console.log('🔧 Actualizando precio rápidamente...\n');

  try {
    // Actualizar solo el plan premium
    await prisma.userBillingPlan.update({
      where: { planKey: 'premium' },
      data: {
        stripePriceId: REAL_PRICE_ID,
        stripeProductId: REAL_PRODUCT_ID,
      },
    });

    console.log('✅ Plan premium actualizado con:');
    console.log(`   Precio: ${REAL_PRICE_ID}`);
    console.log(`   Producto: ${REAL_PRODUCT_ID}`);

    // Verificar actualización
    const plan = await prisma.userBillingPlan.findUnique({
      where: { planKey: 'premium' },
    });

    if (plan?.stripePriceId !== 'price_premium_placeholder') {
      console.log('\n🎉 ¡Listo! Ya puedes probar suscripciones.');
    } else {
      console.log('\n⚠️ Recuerda cambiar los IDs en el script por los reales.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
quickFixPrice();