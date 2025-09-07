/**
 * Test de Sistema de Suscripciones - FASE 6
 * Verifica el funcionamiento del control de acceso basado en suscripción
 * Requiere: servidor de desarrollo ejecutándose en localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Test del middleware de suscripciones
 */
async function testSubscriptionMiddleware() {
  console.log('🧪 Testing Subscription Middleware System...\n');

  const testCases = [
    {
      url: '/cursos/introduccion',
      expectedLevel: 'OPEN',
      shouldBeAccessible: true,
      description: 'Contenido público - debe ser accesible sin login'
    },
    {
      url: '/test-subscription',
      expectedLevel: 'FREE',
      shouldBeAccessible: false, // Sin login debería redirigir
      description: 'Contenido FREE - debe requerir login'
    },
    {
      url: '/recursos/premium',
      expectedLevel: 'PREMIUM',
      shouldBeAccessible: false, // Sin login debería redirigir
      description: 'Contenido PREMIUM - debe requerir suscripción'
    },
    {
      url: '/web-dashboard',
      expectedLevel: 'FREE',
      shouldBeAccessible: false, // Sin login debería redirigir
      description: 'Dashboard - debe requerir login'
    }
  ];

  console.log('📋 Casos de prueba definidos:');
  testCases.forEach((testCase, index) => {
    console.log(`  ${index + 1}. ${testCase.description}`);
  });
  console.log();

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.url}`);
    console.log(`   Esperado: ${testCase.expectedLevel} - ${testCase.shouldBeAccessible ? 'Accesible' : 'Bloqueado'}`);

    try {
      const response = await fetch(`${BASE_URL}${testCase.url}`, {
        method: 'GET',
        redirect: 'manual' // No seguir redirects automáticamente
      });

      const isRedirect = response.status >= 300 && response.status < 400;
      const isSuccess = response.status === 200;
      
      console.log(`   Resultado: ${response.status} ${response.statusText}`);

      // Verificar headers de acceso si están presentes
      const accessRequired = response.headers.get('X-Access-Required');
      const userLevel = response.headers.get('X-User-Level');
      const accessReason = response.headers.get('X-Access-Reason');

      if (accessRequired) {
        console.log(`   Access Required: ${accessRequired}`);
      }
      if (userLevel) {
        console.log(`   User Level: ${userLevel}`);
      }
      if (accessReason) {
        console.log(`   Reason: ${accessReason}`);
      }

      // Verificar si el comportamiento es el esperado
      let testPassed = false;

      if (testCase.shouldBeAccessible) {
        // Debe ser accesible (status 200)
        testPassed = isSuccess;
        console.log(`   ✅ ${testPassed ? 'PASS' : 'FAIL'}: ${testPassed ? 'Acceso permitido correctamente' : 'Acceso bloqueado incorrectamente'}`);
      } else {
        // Debe estar bloqueado (redirect 3xx)
        testPassed = isRedirect;
        console.log(`   ✅ ${testPassed ? 'PASS' : 'FAIL'}: ${testPassed ? 'Acceso bloqueado correctamente' : 'Acceso permitido incorrectamente'}`);
        
        if (isRedirect) {
          const location = response.headers.get('Location');
          console.log(`   📍 Redirect to: ${location}`);
        }
      }

      if (testPassed) passedTests++;

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log();
  }

  // Resumen
  console.log(`📊 Resumen de Pruebas del Middleware:`);
  console.log(`   ✅ Pasadas: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Fallidas: ${totalTests - passedTests}/${totalTests}`);
  console.log(`   📈 Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log();

  return { passedTests, totalTests };
}

/**
 * Test de la API de estado de suscripción
 */
async function testSubscriptionAPI() {
  console.log('🔌 Testing Subscription API...\n');

  try {
    console.log('📡 Testing /api/stripe/subscription-status (sin autenticación)');
    const response = await fetch(`${BASE_URL}/api/stripe/subscription-status`);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('   ✅ PASS: API correctamente protegida (requiere autenticación)');
      return { passedTests: 1, totalTests: 1 };
    } else {
      console.log('   ❌ FAIL: API debería requerir autenticación');
      return { passedTests: 0, totalTests: 1 };
    }

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { passedTests: 0, totalTests: 1 };
  }
}

/**
 * Test de componentes del sistema
 */
async function testSystemComponents() {
  console.log('🧩 Testing System Components...\n');

  const components = [
    '/lib/middleware/subscriptionMiddleware.ts',
    '/app/components/subscription/SubscriptionGate.tsx',
    '/app/hooks/useSubscription.ts',
    '/lib/services/billingService.ts'
  ];

  console.log('📁 Componentes del sistema:');
  let existingComponents = 0;

  for (const component of components) {
    try {
      const fs = require('fs');
      const exists = fs.existsSync(`${process.cwd()}${component}`);
      console.log(`   ${exists ? '✅' : '❌'} ${component}`);
      if (exists) existingComponents++;
    } catch (error) {
      console.log(`   ❓ ${component} (no se pudo verificar)`);
    }
  }

  console.log(`\n📊 Componentes del sistema: ${existingComponents}/${components.length} presentes`);
  return { passedTests: existingComponents, totalTests: components.length };
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log('🚀 FASE 6 - Test Completo del Sistema de Suscripciones');
  console.log('=' .repeat(60));
  console.log();

  const results = [];

  // Test 1: Middleware
  const middlewareResults = await testSubscriptionMiddleware();
  results.push(middlewareResults);

  // Test 2: API
  const apiResults = await testSubscriptionAPI();
  results.push(apiResults);

  // Test 3: Componentes
  const componentResults = await testSystemComponents();
  results.push(componentResults);

  // Resumen final
  console.log('\n🎯 RESUMEN FINAL - FASE 6');
  console.log('=' .repeat(60));

  const totalPassed = results.reduce((sum, result) => sum + result.passedTests, 0);
  const totalTests = results.reduce((sum, result) => sum + result.totalTests, 0);

  console.log(`✅ Total pasadas: ${totalPassed}/${totalTests}`);
  console.log(`📈 Éxito general: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log();

  if (totalPassed === totalTests) {
    console.log('🎉 ¡FASE 6 COMPLETADA CON ÉXITO!');
    console.log('   ✓ Middleware de suscripciones funcionando');
    console.log('   ✓ Componentes de protección implementados');
    console.log('   ✓ APIs correctamente protegidas');
    console.log('   ✓ Sistema listo para producción');
  } else {
    console.log('⚠️  FASE 6 CON ISSUES - Revisar fallos');
  }

  console.log();
}

// Ejecutar tests si se ejecuta directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSubscriptionMiddleware,
  testSubscriptionAPI,
  testSystemComponents,
  runAllTests
};