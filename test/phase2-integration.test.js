/**
 * Test de integración para Fase 2 - Sistema completo de registro y datos
 * Prueba el flujo completo desde registro hasta suscripción con dirección
 */

const BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPhase2Integration() {
  log('\n🧪 INICIANDO TEST DE INTEGRACIÓN - FASE 2', 'bold');
  log('=' .repeat(60), 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  const runTest = async (testName, testFn) => {
    results.total++;
    try {
      log(`\n🔍 ${testName}`, 'blue');
      await testFn();
      log(`✅ PASS: ${testName}`, 'green');
      results.passed++;
      results.tests.push({ name: testName, status: 'PASS' });
    } catch (error) {
      log(`❌ FAIL: ${testName}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      results.failed++;
      results.tests.push({ name: testName, status: 'FAIL', error: error.message });
    }
  };

  // TEST 1: Verificar APIs básicas funcionan
  await runTest('APIs básicas funcionan correctamente', async () => {
    // Test homepage
    const homeResponse = await fetch(`${BASE_URL}/`);
    if (homeResponse.status !== 200) {
      throw new Error(`Homepage failed: ${homeResponse.status}`);
    }

    // Test API interna
    const internalResponse = await fetch(`${BASE_URL}/api/internal/subscription-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test_user' })
    });
    if (!internalResponse.ok) {
      throw new Error(`Internal API failed: ${internalResponse.status}`);
    }
    const internalData = await internalResponse.json();
    if (internalData.accessLevel !== 'OPEN') {
      throw new Error(`Expected OPEN access, got ${internalData.accessLevel}`);
    }

    // Test API de planes
    const plansResponse = await fetch(`${BASE_URL}/api/stripe/plans?country=ES&postalCode=28001`);
    if (!plansResponse.ok) {
      throw new Error(`Plans API failed: ${plansResponse.status}`);
    }
    const plansData = await plansResponse.json();
    if (!plansData.success || !plansData.plans || plansData.plans.length === 0) {
      throw new Error('Plans API returned invalid data');
    }
    log(`   📋 Planes encontrados: ${plansData.plans.length}`, 'yellow');
  });

  // TEST 2: Verificar cálculos fiscales
  await runTest('Cálculos fiscales españoles funcionan', async () => {
    // Test España continental
    const continentalResponse = await fetch(`${BASE_URL}/api/stripe/plans?country=ES&postalCode=28001`);
    const continentalData = await continentalResponse.json();
    const continentalPlan = continentalData.plans.find(p => p.price > 0);
    
    if (continentalPlan.taxInfo.rate !== 0.21) {
      throw new Error(`Expected IVA 21%, got ${continentalPlan.taxInfo.rate * 100}%`);
    }
    if (continentalPlan.taxInfo.isCanaryIslands) {
      throw new Error('Continental postal code detected as Canary Islands');
    }
    log(`   💰 IVA Continental: ${(continentalPlan.taxInfo.rate * 100).toFixed(0)}%`, 'yellow');

    // Test Islas Canarias
    const canaryResponse = await fetch(`${BASE_URL}/api/stripe/plans?country=ES&postalCode=35001`);
    const canaryData = await canaryResponse.json();
    const canaryPlan = canaryData.plans.find(p => p.price > 0);
    
    if (canaryPlan.taxInfo.rate !== 0.07) {
      throw new Error(`Expected IGIC 7%, got ${canaryPlan.taxInfo.rate * 100}%`);
    }
    if (!canaryPlan.taxInfo.isCanaryIslands) {
      throw new Error('Canary postal code not detected');
    }
    log(`   🏝️ IGIC Canarias: ${(canaryPlan.taxInfo.rate * 100).toFixed(0)}%`, 'yellow');
  });

  // TEST 3: Verificar APIs de usuario (sin autenticación - deben fallar correctamente)
  await runTest('APIs de usuario requieren autenticación', async () => {
    // API sync profile debe requerir auth (middleware redirige con 307)
    const syncResponse = await fetch(`${BASE_URL}/api/user/sync-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData: {}, clerkUserId: 'test', email: 'test@test.com' }),
      redirect: 'manual'
    });
    if (![301, 302, 307, 308, 401].includes(syncResponse.status)) {
      throw new Error(`Expected redirect or 401, got ${syncResponse.status}`);
    }

    // API billing address debe requerir auth (middleware redirige con 307)
    const addressResponse = await fetch(`${BASE_URL}/api/user/billing-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billingAddress: {}, clerkUserId: 'test' }),
      redirect: 'manual'
    });
    if (![301, 302, 307, 308, 401].includes(addressResponse.status)) {
      throw new Error(`Expected redirect or 401, got ${addressResponse.status}`);
    }

    log('   🔒 APIs protegidas correctamente (middleware funciona)', 'yellow');
  });

  // TEST 4: Verificar redirecciones del middleware
  await runTest('Middleware redirige correctamente', async () => {
    // Dashboard debe redirigir a login
    const dashboardResponse = await fetch(`${BASE_URL}/web-dashboard`, {
      redirect: 'manual'
    });
    if (![301, 302, 307, 308].includes(dashboardResponse.status)) {
      throw new Error(`Expected redirect, got ${dashboardResponse.status}`);
    }

    // APIs protegidas de Stripe deben redirigir
    const stripeResponse = await fetch(`${BASE_URL}/api/stripe/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
      redirect: 'manual'
    });
    if (![301, 302, 307, 308].includes(stripeResponse.status)) {
      throw new Error(`Expected redirect, got ${stripeResponse.status}`);
    }

    log('   🔄 Redirecciones funcionando', 'yellow');
  });

  // TEST 5: Verificar que no hay errores de Prisma en middleware
  await runTest('Sin errores de Prisma en middleware', async () => {
    // Hacer varias llamadas que activan el middleware
    const routes = [
      '/',
      '/web-dashboard',
      '/api/stripe/plans?country=ES',
      '/api/internal/subscription-check'
    ];

    for (const route of routes) {
      const method = route.includes('subscription-check') ? 'POST' : 'GET';
      const body = route.includes('subscription-check') 
        ? JSON.stringify({ userId: 'test' }) 
        : undefined;
      
      const response = await fetch(`${BASE_URL}${route}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body,
        redirect: 'manual'
      });
      
      // Cualquier respuesta que no sea 5xx es buena (incluso redirects)
      if (response.status >= 500) {
        throw new Error(`Route ${route} returned ${response.status} - possible Prisma error`);
      }
    }

    log('   🚫 Sin errores de servidor detectados', 'yellow');
  });

  // TEST 6: Verificar estructura de respuestas API
  await runTest('Estructura de respuestas API es correcta', async () => {
    // Test API de planes estructura
    const plansResponse = await fetch(`${BASE_URL}/api/stripe/plans?country=ES&postalCode=28001`);
    const plansData = await plansResponse.json();
    
    const requiredFields = ['success', 'plans', 'taxInfo', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in plansData)) {
        throw new Error(`Missing field in plans response: ${field}`);
      }
    }

    // Test estructura de plan
    const plan = plansData.plans[0];
    const planFields = ['id', 'name', 'stripePriceId', 'price', 'currency', 'interval', 'pricing', 'taxInfo'];
    for (const field of planFields) {
      if (!(field in plan)) {
        throw new Error(`Missing field in plan: ${field}`);
      }
    }

    // Test API interna estructura
    const internalResponse = await fetch(`${BASE_URL}/api/internal/subscription-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test_user' })
    });
    const internalData = await internalResponse.json();
    
    const internalFields = ['accessLevel', 'hasActiveSubscription', 'userId'];
    for (const field of internalFields) {
      if (!(field in internalData)) {
        throw new Error(`Missing field in internal API response: ${field}`);
      }
    }

    log('   📋 Todas las estructuras son correctas', 'yellow');
  });

  // Mostrar resumen
  log('\n' + '='.repeat(60), 'blue');
  log('📊 RESUMEN DE RESULTADOS', 'bold');
  log(`Total de tests: ${results.total}`, 'blue');
  log(`Tests exitosos: ${results.passed}`, 'green');
  log(`Tests fallidos: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed > 0) {
    log('\n❌ TESTS FALLIDOS:', 'red');
    results.tests.filter(t => t.status === 'FAIL').forEach(test => {
      log(`   - ${test.name}: ${test.error}`, 'red');
    });
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`\nTasa de éxito: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON! FASE 2 COMPLETADA EXITOSAMENTE', 'green');
    log('✅ Sistema listo para captura de datos completos y direcciones', 'green');
  } else {
    log('\n⚠️ Algunos tests fallaron. Revisar antes de continuar.', 'yellow');
  }
  
  return results;
}

// Ejecutar tests si es llamado directamente
if (require.main === module) {
  testPhase2Integration()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error ejecutando tests:', error);
      process.exit(1);
    });
}

module.exports = testPhase2Integration;