import { PrismaClient } from '@prisma/client'

// Test de tipos TypeScript generados por Prisma
const prisma = new PrismaClient()

// Verificar que los modelos están disponibles
type UserBillingPlan = Parameters<typeof prisma.userBillingPlan.create>[0]['data']
type UserSubscription = Parameters<typeof prisma.userSubscription.create>[0]['data']
type UserBillingAddress = Parameters<typeof prisma.userBillingAddress.create>[0]['data']
type UserActivityLog = Parameters<typeof prisma.userActivityLog.create>[0]['data']
type UserPermission = Parameters<typeof prisma.userPermission.create>[0]['data']

// Test de ejemplo de uso
async function testPrismaTypes() {
  // UserBillingPlan
  const billingPlan: UserBillingPlan = {
    userId: 'user_123',
    planName: 'Premium',
    planType: 'monthly',
    price: 29.99,
    currency: 'USD',
    isActive: true
  }

  // UserSubscription
  const subscription: UserSubscription = {
    userId: 'user_123',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date()
  }

  // UserBillingAddress
  const address: UserBillingAddress = {
    userId: 'user_123',
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'New York',
    country: 'US'
  }

  // UserActivityLog
  const activityLog: UserActivityLog = {
    userId: 'user_123',
    action: 'login',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }

  // UserPermission
  const permission: UserPermission = {
    userId: 'user_123',
    type: 'feature',
    value: 'premium_dashboard'
  }

  console.log('Todos los tipos TypeScript están disponibles correctamente')
}

export { testPrismaTypes }