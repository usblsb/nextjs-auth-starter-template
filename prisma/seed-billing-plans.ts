/**
 * Script de seed para poblar UserBillingPlan
 * Crea los planes de facturación básicos (FREE y PREMIUM)
 * 
 * Ejecutar con: npx tsx prisma/seed-billing-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const billingPlans = [
  {
    planKey: 'free',
    name: 'Plan Gratuito',
    description: 'Acceso a contenido básico y gratuito de la academia',
    stripePriceId: 'price_free_placeholder', // Actualizar después desde Stripe Dashboard
    stripeProductId: 'prod_free_placeholder', // Actualizar después desde Stripe Dashboard
    price: 0.00,
    currency: 'EUR',
    interval: 'month',
    isActive: true,
    meta: {
      features: ['OPEN', 'FREE'],
      accessLevel: 'FREE',
      contentTypes: ['open', 'free'],
      maxCourses: 5,
      maxLessons: 50,
      supportLevel: 'community',
      description: 'Perfecto para empezar a aprender electrónica',
    },
  },
  {
    planKey: 'premium',
    name: 'Plan Premium',
    description: 'Acceso completo a todo el contenido premium de la academia',
    stripePriceId: 'price_premium_placeholder', // Actualizar después desde Stripe Dashboard
    stripeProductId: 'prod_premium_placeholder', // Actualizar después desde Stripe Dashboard
    price: 29.00,
    currency: 'EUR',
    interval: 'month',
    isActive: true,
    meta: {
      features: ['OPEN', 'FREE', 'PREMIUM'],
      accessLevel: 'PREMIUM',
      contentTypes: ['open', 'free', 'premium'],
      maxCourses: -1, // Ilimitado
      maxLessons: -1, // Ilimitado
      supportLevel: 'priority',
      description: 'Acceso completo + soporte prioritario',
      benefits: [
        'Acceso a todos los cursos y lecciones',
        'Contenido premium exclusivo',
        'Soporte técnico prioritario',
        'Certificados de finalización',
        'Acceso a webinars en vivo',
        'Descargas de recursos premium'
      ],
    },
  },
  {
    planKey: 'premium_annual',
    name: 'Plan Premium Anual',
    description: 'Plan premium con descuento anual (2 meses gratis)',
    stripePriceId: 'price_premium_annual_placeholder', // Actualizar después desde Stripe Dashboard
    stripeProductId: 'prod_premium_placeholder', // Mismo producto, precio diferente
    price: 290.00, // 10 meses al precio de 12
    currency: 'EUR',
    interval: 'year',
    isActive: true,
    meta: {
      features: ['OPEN', 'FREE', 'PREMIUM'],
      accessLevel: 'PREMIUM',
      contentTypes: ['open', 'free', 'premium'],
      maxCourses: -1,
      maxLessons: -1,
      supportLevel: 'priority',
      description: 'Mismo acceso premium con 2 meses gratis',
      benefits: [
        'Todo lo incluido en el plan premium',
        'Ahorro del 17% (2 meses gratis)',
        'Facturación anual simplificada'
      ],
      discount: {
        type: 'annual',
        monthsFree: 2,
        savingsPercentage: 17,
      },
    },
  },
];

async function main() {
  console.log('🌱 Iniciando seed de planes de facturación...');

  try {
    // Limpiar planes existentes (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Limpiando planes existentes (desarrollo)...');
      await prisma.userBillingPlan.deleteMany({});
    }

    // Insertar planes de facturación
    for (const plan of billingPlans) {
      console.log(`📋 Creando plan: ${plan.name}`);
      
      await prisma.userBillingPlan.upsert({
        where: { planKey: plan.planKey },
        create: plan,
        update: {
          ...plan,
          updatedAt: new Date(),
        },
      });
      
      console.log(`✅ Plan creado: ${plan.planKey} - ${plan.name}`);
    }

    console.log('\n📊 Resumen de planes creados:');
    const createdPlans = await prisma.userBillingPlan.findMany({
      orderBy: { price: 'asc' },
    });

    createdPlans.forEach(plan => {
      console.log(`  • ${plan.name}: €${plan.price}/${plan.interval} (${plan.planKey})`);
    });

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n⚠️  RECORDATORIO:');
    console.log('   1. Crear productos en Stripe Dashboard');
    console.log('   2. Actualizar stripePriceId y stripeProductId');
    console.log('   3. Ejecutar: npx tsx prisma/update-stripe-ids.ts');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed
main()
  .catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
  });