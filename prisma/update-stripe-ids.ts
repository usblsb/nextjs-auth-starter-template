/**
 * Script para actualizar los IDs de Stripe en UserBillingPlan
 * Ejecutar después de crear productos en Stripe Dashboard
 * 
 * Uso: npx tsx prisma/update-stripe-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import { stripe } from '../lib/stripe/client';

const prisma = new PrismaClient();

// Mapeo de planes locales con productos de Stripe
// ACTUALIZAR estos IDs después de crear productos en Stripe Dashboard
const STRIPE_MAPPINGS = {
  free: {
    productId: 'prod_XXXXXX', // Producto gratuito en Stripe
    priceId: 'price_XXXXXX', // Precio gratuito (€0)
  },
  premium: {
    productId: 'prod_XXXXXX', // Producto premium en Stripe
    priceId: 'price_XXXXXX', // Precio mensual (€29)
  },
  premium_annual: {
    productId: 'prod_XXXXXX', // Mismo producto premium
    priceId: 'price_XXXXXX', // Precio anual (€290)
  },
};

/**
 * Valida que los productos y precios existen en Stripe
 */
async function validateStripeIds() {
  console.log('🔍 Validando IDs de Stripe...');

  for (const [planKey, mapping] of Object.entries(STRIPE_MAPPINGS)) {
    try {
      // Validar producto
      if (mapping.productId !== 'prod_XXXXXX') {
        const product = await stripe.products.retrieve(mapping.productId);
        console.log(`✅ Producto válido: ${product.name} (${product.id})`);
      } else {
        console.log(`⚠️  ${planKey}: Producto ID placeholder - actualizar manualmente`);
      }

      // Validar precio
      if (mapping.priceId !== 'price_XXXXXX') {
        const price = await stripe.prices.retrieve(mapping.priceId);
        console.log(`✅ Precio válido: ${price.unit_amount/100} ${price.currency} (${price.id})`);
      } else {
        console.log(`⚠️  ${planKey}: Precio ID placeholder - actualizar manualmente`);
      }

    } catch (error) {
      console.error(`❌ Error validando ${planKey}:`, error);
    }
  }
}

/**
 * Actualiza los IDs de Stripe en la base de datos
 */
async function updateStripeIds() {
  console.log('\n📝 Actualizando IDs en base de datos...');

  for (const [planKey, mapping] of Object.entries(STRIPE_MAPPINGS)) {
    // Solo actualizar si no son placeholders
    if (mapping.productId === 'prod_XXXXXX' || mapping.priceId === 'price_XXXXXX') {
      console.log(`⏭️  Saltando ${planKey}: IDs no configurados`);
      continue;
    }

    try {
      await prisma.userBillingPlan.update({
        where: { planKey },
        data: {
          stripeProductId: mapping.productId,
          stripePriceId: mapping.priceId,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Actualizado ${planKey}: ${mapping.productId} / ${mapping.priceId}`);

    } catch (error) {
      console.error(`❌ Error actualizando ${planKey}:`, error);
    }
  }
}

/**
 * Lista los productos y precios de Stripe para referencia
 */
async function listStripeProducts() {
  console.log('\n📋 Productos disponibles en Stripe:');

  try {
    const products = await stripe.products.list({ active: true });
    
    for (const product of products.data) {
      console.log(`\n🎯 ${product.name} (${product.id})`);
      
      // Obtener precios para este producto
      const prices = await stripe.prices.list({ 
        product: product.id,
        active: true 
      });

      prices.data.forEach(price => {
        const amount = price.unit_amount ? `€${price.unit_amount/100}` : 'Gratis';
        const interval = price.recurring?.interval ? `/${price.recurring.interval}` : '';
        console.log(`   💰 ${amount}${interval} (${price.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error listando productos de Stripe:', error);
  }
}

async function main() {
  console.log('🔄 Iniciando actualización de IDs de Stripe...\n');

  try {
    // 1. Listar productos existentes en Stripe
    await listStripeProducts();

    // 2. Validar IDs configurados
    await validateStripeIds();

    // 3. Actualizar base de datos
    await updateStripeIds();

    // 4. Mostrar estado final
    console.log('\n📊 Estado final de planes:');
    const plans = await prisma.userBillingPlan.findMany({
      orderBy: { price: 'asc' },
    });

    plans.forEach(plan => {
      const productOk = plan.stripeProductId !== 'prod_XXXXXX';
      const priceOk = plan.stripePriceId !== 'price_XXXXXX';
      const status = (productOk && priceOk) ? '✅' : '⚠️';
      
      console.log(`${status} ${plan.name}:`);
      console.log(`   Product: ${plan.stripeProductId}`);
      console.log(`   Price: ${plan.stripePriceId}`);
    });

    console.log('\n🎉 Actualización completada!');

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error fatal:', e);
      process.exit(1);
    });
}

export { updateStripeIds, validateStripeIds, listStripeProducts };