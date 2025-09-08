/**
 * Script para configurar planes de facturación en la base de datos
 * Asegura que los planes existen para sincronización con Stripe
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BILLING_PLANS = [
  {
    planKey: 'premium-monthly',
    name: 'Premium Mensual',
    description: 'Acceso completo a todo el contenido de la academia',
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    stripeProductId: process.env.STRIPE_PRODUCT_ID || '',
    price: 29.00,
    currency: 'EUR',
    interval: 'month',
    isActive: true,
    meta: {
      features: ['PREMIUM'],
      displayName: 'Plan Premium',
      description: 'Acceso total a cursos, recursos y comunidad',
      popular: true,
    },
  },
  {
    planKey: 'premium-yearly',
    name: 'Premium Anual', 
    description: 'Acceso completo anual con descuento',
    stripePriceId: process.env.STRIPE_PRICE_ID_YEARLY || '',
    stripeProductId: process.env.STRIPE_PRODUCT_ID || '',
    price: 290.00,
    currency: 'EUR', 
    interval: 'year',
    isActive: true,
    meta: {
      features: ['PREMIUM'],
      displayName: 'Plan Premium Anual',
      description: 'Acceso total con 2 meses gratis',
      discount: '17% descuento',
      popular: false,
    },
  },
] as const;

async function setupBillingPlans() {
  try {
    console.log('🏗️  Setting up billing plans...');

    for (const plan of BILLING_PLANS) {
      if (!plan.stripePriceId) {
        console.warn(`⚠️  Missing STRIPE_PRICE_ID for ${plan.planKey}, skipping...`);
        continue;
      }

      const existingPlan = await prisma.userBillingPlan.findUnique({
        where: { stripePriceId: plan.stripePriceId }
      });

      if (existingPlan) {
        // Actualizar plan existente
        await prisma.userBillingPlan.update({
          where: { stripePriceId: plan.stripePriceId },
          data: {
            planKey: plan.planKey,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            interval: plan.interval,
            isActive: plan.isActive,
            meta: plan.meta as any,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Updated plan: ${plan.name} (${plan.stripePriceId})`);
      } else {
        // Crear nuevo plan
        await prisma.userBillingPlan.create({
          data: {
            planKey: plan.planKey,
            name: plan.name,
            description: plan.description,
            stripePriceId: plan.stripePriceId,
            stripeProductId: plan.stripeProductId,
            price: plan.price,
            currency: plan.currency,
            interval: plan.interval,
            isActive: plan.isActive,
            meta: plan.meta as any,
          },
        });

        console.log(`✨ Created plan: ${plan.name} (${plan.stripePriceId})`);
      }
    }

    // Verificar planes configurados
    const allPlans = await prisma.userBillingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    console.log('\n📋 Active billing plans:');
    allPlans.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.price} ${plan.currency}/${plan.interval} (${plan.stripePriceId})`);
    });

    console.log('\n✅ Billing plans setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up billing plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
if (require.main === module) {
  setupBillingPlans()
    .then(() => {
      console.log('🎉 Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export default setupBillingPlans;