const { PrismaClient } = require('@prisma/client');

async function debugSubscriptions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando datos de suscripciones...\n');
    
    // 1. Verificar UserProfiles
    const userProfiles = await prisma.userProfile.findMany({
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📋 UserProfiles encontrados: ${userProfiles.length}`);
    userProfiles.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, ClerkUserId: ${user.clerkUserId}, Email: ${user.email}`);
    });
    console.log('');
    
    // 2. Verificar UserSubscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      select: {
        id: true,
        userId: true,
        stripeSubscriptionId: true,
        status: true,
        createdAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        stripePriceId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`💳 UserSubscriptions encontradas: ${subscriptions.length}`);
    subscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. UserID: ${sub.userId}, StripeSubID: ${sub.stripeSubscriptionId}, Status: ${sub.status}`);
      console.log(`      PriceID: ${sub.stripePriceId}, Period: ${sub.currentPeriodStart} -> ${sub.currentPeriodEnd}`);
    });
    console.log('');
    
    // 3. Verificar UserBillingPlans
    const billingPlans = await prisma.userBillingPlan.findMany({
      select: {
        planKey: true,
        name: true,
        stripePriceId: true,
        stripeProductId: true,
        price: true,
        currency: true,
        interval: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`💰 UserBillingPlans encontrados: ${billingPlans.length}`);
    billingPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. Key: ${plan.planKey}, Name: ${plan.name}, PriceID: ${plan.stripePriceId}, Active: ${plan.isActive}`);
    });
    console.log('');
    
    // 4. Verificar si existe billingPlan para las suscripciones
    if (subscriptions.length > 0) {
      console.log(`🔍 Verificando relación billingPlan para suscripciones:`);
      for (const sub of subscriptions) {
        const matchingPlan = billingPlans.find(plan => plan.stripePriceId === sub.stripePriceId);
        console.log(`  Sub ${sub.stripeSubscriptionId} (${sub.stripePriceId}): ${matchingPlan ? '✅ Plan encontrado' : '❌ Plan NO encontrado'}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSubscriptions();