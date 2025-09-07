/**
 * Script de testing para APIs de Stripe
 * Ejecutar con: node test-stripe-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Función helper para hacer requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log(`\n🔗 ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    console.log(`📡 Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data, ok: response.ok };
    
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return { error: error.message, ok: false };
  }
}

async function testStripeAPIs() {
  console.log('🧪 Testing Stripe APIs...\n');
  console.log('=' + '='.repeat(50));

  // Test 1: Get billing plans (sin autenticación)
  console.log('\n1️⃣ Testing GET /api/stripe/plans');
  await apiRequest('/api/stripe/plans');

  // Test 2: Get plans with Spanish tax info
  console.log('\n2️⃣ Testing GET /api/stripe/plans?country=ES&postalCode=28001');
  await apiRequest('/api/stripe/plans?country=ES&postalCode=28001');

  // Test 3: Get plans with Canary Islands tax info
  console.log('\n3️⃣ Testing GET /api/stripe/plans?country=ES&postalCode=35001');
  await apiRequest('/api/stripe/plans?country=ES&postalCode=35001');

  // Test 4: Test tax preview endpoint
  console.log('\n4️⃣ Testing GET /api/stripe/create-subscription?country=ES&postalCode=28001 (sin auth - debe fallar)');
  await apiRequest('/api/stripe/create-subscription?country=ES&postalCode=28001');

  // Test 5: Test subscription status (sin auth - debe fallar)
  console.log('\n5️⃣ Testing GET /api/stripe/subscription-status (sin auth - debe fallar)');
  await apiRequest('/api/stripe/subscription-status');

  // Test 6: Test portal access (sin auth - debe fallar)
  console.log('\n6️⃣ Testing GET /api/stripe/create-portal-session (sin auth - debe fallar)');
  await apiRequest('/api/stripe/create-portal-session');

  // Test 7: Test cancel subscription info (sin auth - debe fallar)
  console.log('\n7️⃣ Testing GET /api/stripe/cancel-subscription (sin auth - debe fallar)');
  await apiRequest('/api/stripe/cancel-subscription');

  console.log('\n' + '='.repeat(60));
  console.log('✅ API Testing completed!');
  console.log('\n📝 NOTAS:');
  console.log('   • Endpoints públicos: /api/stripe/plans ✅');
  console.log('   • Endpoints protegidos: Requieren autenticación Clerk 🔒');
  console.log('   • Fiscalidad: IVA 21% (Continental) vs IGIC 7% (Canarias) 🇪🇸');
  console.log('\n🔒 Para probar endpoints protegidos:');
  console.log('   1. Hacer login en http://localhost:3000/sign-in');
  console.log('   2. Usar cookies de sesión en requests');
  console.log('   3. O usar curl con headers de autenticación');
}

// Ejecutar tests
testStripeAPIs().catch(console.error);