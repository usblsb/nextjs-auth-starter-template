/**
 * Script para crear precio de test en Stripe (desarrollo)
 * Ejecutar: npx tsx scripts/create-test-price.ts
 */

import { stripe } from '@/lib/stripe/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPrice() {
  console.log('🛠️ Creando precio de test en Stripe...\n');

  try {
    // 1. Crear producto de test
    console.log('📦 Creando producto de test...');
    const product = await stripe.products.create({
      name: 'Plan Premium (Test)',
      description: 'Plan premium para desarrollo y testing',
      metadata: {
        environment: 'development',
        plan_key: 'premium'
      }
    });
    console.log(`✅ Producto creado: ${product.id}`);

    // 2. Crear precio de test
    console.log('💰 Creando precio de test...');
    const price = await stripe.prices.create({
      unit_amount: 2900, // €29.00 en centavos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      product: product.id,
      metadata: {
        environment: 'development',
        plan_key: 'premium'
      }
    });
    console.log(`✅ Precio creado: ${price.id}`);

    // 3. Actualizar base de datos
    console.log('💾 Actualizando base de datos...');
    await prisma.userBillingPlan.update({
      where: { planKey: 'premium' },
      data: {
        stripePriceId: price.id,
        stripeProductId: product.id,
      },
    });
    console.log('✅ Base de datos actualizada');

    // 4. Mostrar resultado
    console.log('\n🎉 Precio de test creado exitosamente!');
    console.log(`📋 Producto ID: ${product.id}`);
    console.log(`💰 Precio ID: ${price.id}`);
    
    console.log('\n✅ Ya puedes probar suscripciones en desarrollo');

  } catch (error) {
    console.error('❌ Error creando precio de test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
createTestPrice()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });