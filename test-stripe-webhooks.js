/**
 * Script para testing de webhooks de Stripe
 * Simula eventos comunes de Stripe para verificar el endpoint
 */

const BASE_URL = 'http://localhost:3000';

// Eventos de ejemplo para testing
const SAMPLE_EVENTS = {
  'customer.subscription.created': {
    id: 'evt_test_subscription_created',
    type: 'customer.subscription.created',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_12345',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test_customer',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        cancel_at_period_end: false,
        items: {
          data: [{
            price: {
              id: 'price_premium_test',
              currency: 'eur',
              unit_amount: 2900,
              recurring: { interval: 'month' }
            }
          }]
        },
        metadata: {
          clerk_user_id: 'user_test_12345'
        }
      }
    }
  },

  'customer.subscription.updated': {
    id: 'evt_test_subscription_updated',
    type: 'customer.subscription.updated',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_12345',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test_customer',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        cancel_at_period_end: true,
        items: {
          data: [{
            price: {
              id: 'price_premium_test',
              currency: 'eur',
              unit_amount: 2900,
              recurring: { interval: 'month' }
            }
          }]
        },
        metadata: {
          clerk_user_id: 'user_test_12345'
        }
      },
      previous_attributes: {
        cancel_at_period_end: false
      }
    }
  },

  'invoice.payment_succeeded': {
    id: 'evt_test_payment_succeeded',
    type: 'invoice.payment_succeeded',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'in_test_12345',
        object: 'invoice',
        customer: 'cus_test_customer',
        subscription: 'sub_test_12345',
        amount_paid: 3509, // €35.09 with 21% VAT
        currency: 'eur',
        status: 'paid',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      }
    }
  }
};

async function testWebhookEndpoint(eventType, eventData) {
  console.log(`\\n🔗 Testing webhook: ${eventType}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature', // Para desarrollo
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();
    
    console.log(`📡 Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, result };

  } catch (error) {
    console.error(`❌ Error testing ${eventType}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runWebhookTests() {
  console.log('🧪 Testing Stripe Webhooks...');
  console.log('=' + '='.repeat(50));

  // Test endpoint está disponible
  console.log('\\n0️⃣ Testing webhook endpoint availability');
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'GET'
    });
    console.log(`📡 GET Status: ${response.status} (should be 405 - Method Not Allowed)`);
  } catch (error) {
    console.error('❌ Webhook endpoint not reachable:', error.message);
    return;
  }

  // Test eventos individuales
  for (const [eventType, eventData] of Object.entries(SAMPLE_EVENTS)) {
    await testWebhookEndpoint(eventType, eventData);
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\\n' + '='.repeat(60));
  console.log('✅ Webhook testing completed!');
  console.log('\\n📝 NOTAS:');
  console.log('   • En desarrollo: Validación de firma desactivada');
  console.log('   • Customer metadata debe incluir clerk_user_id');
  console.log('   • Los IDs de test no existen en Stripe real');
  console.log('\\n🔧 Para testing real con Stripe CLI:');
  console.log('   1. stripe login');
  console.log('   2. stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('   3. stripe trigger customer.subscription.created');
}

// Ejecutar tests
runWebhookTests().catch(console.error);