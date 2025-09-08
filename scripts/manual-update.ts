/**
 * Script para actualizar manualmente con IDs específicos
 * Ejecutar: npx tsx scripts/manual-update.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔧 CAMBIA SOLO LOS PRICE IDs (PRODUCT IDs YA ESTÁN CONFIGURADOS):

// Plan Premium Mensual (€29.00/mes)
const MONTHLY_PRICE: string = 'price_1S4pvpPTRmTjQRqQoSL8UCxU'; // ✅ Price ID configurado
const MONTHLY_PRODUCT: string = 'prod_T0rfGrRUguN2rS'; // ✅ Product ID ya configurado

// Plan Premium Anual (€290.00/año) 
const ANNUAL_PRICE: string = 'price_1S4pxPPTRmTjQRqQibJleOpW'; // ✅ Price ID configurado
const ANNUAL_PRODUCT: string = 'prod_T0rgaqU8pHrXIt'; // ✅ Product ID ya configurado

async function manualUpdate() {
  console.log('🔧 Actualizando suscripciones manualmente...\n');
  console.log('💡 IMPORTANTE: Los precios incluyen impuestos\n');

  try {
    // Solo actualizar si no son placeholders
    if (MONTHLY_PRICE !== 'price_XXXXXXXXXXXXXXXX') {
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium' },
        data: {
          stripePriceId: MONTHLY_PRICE,
          stripeProductId: MONTHLY_PRODUCT,
        },
      });
      console.log('✅ Plan Premium Mensual actualizado:', MONTHLY_PRICE);
    } else {
      console.log('⚠️ Actualiza MONTHLY_PRICE en el script');
    }

    if (ANNUAL_PRICE !== 'price_XXXXXXXXXXXXXXXX') {
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium_annual' },
        data: {
          stripePriceId: ANNUAL_PRICE,
          stripeProductId: ANNUAL_PRODUCT,
        },
      });
      console.log('✅ Plan Premium Anual actualizado:', ANNUAL_PRICE);
    } else {
      console.log('⚠️ Actualiza ANNUAL_PRICE en el script');
    }

    console.log('\n🎉 ¡Listo para probar suscripciones!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualUpdate();