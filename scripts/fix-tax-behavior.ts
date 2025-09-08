/**
 * Script para calcular precios correctos sin impuestos
 * Los precios deben ser tax-exclusive para que IGIC se aplique correctamente
 */

console.log('🧮 Calculando precios correctos para tax-exclusive...\n');

// Precios objetivo (lo que quieres cobrar al final)
const TARGET_MONTHLY = 29.00; // €29 total deseado
const TARGET_ANNUAL = 290.00; // €290 total deseado

// Tasa IGIC Canarias
const IGIC_RATE = 0.07; // 7%

// Calcular precios base (sin impuestos)
const monthlyBase = TARGET_MONTHLY / (1 + IGIC_RATE);
const annualBase = TARGET_ANNUAL / (1 + IGIC_RATE);

console.log('📊 PRECIOS CORRECTOS PARA STRIPE (tax-exclusive):');
console.log(`\n💰 Plan Premium Mensual:`);
console.log(`   Precio base: €${monthlyBase.toFixed(2)}`);
console.log(`   + IGIC (7%): €${(monthlyBase * IGIC_RATE).toFixed(2)}`);
console.log(`   = Total: €${TARGET_MONTHLY.toFixed(2)}`);
console.log(`   Centavos para Stripe: ${Math.round(monthlyBase * 100)}`);

console.log(`\n💰 Plan Premium Anual:`);
console.log(`   Precio base: €${annualBase.toFixed(2)}`);
console.log(`   + IGIC (7%): €${(annualBase * IGIC_RATE).toFixed(2)}`);
console.log(`   = Total: €${TARGET_ANNUAL.toFixed(2)}`);
console.log(`   Centavos para Stripe: ${Math.round(annualBase * 100)}`);

console.log('\n🔧 PASOS A SEGUIR:');
console.log('1. Editar precios en Stripe Dashboard');
console.log('2. Cambiar amounts a los valores de arriba');
console.log('3. Cambiar tax_behavior de "inclusive" a "exclusive"');
console.log('4. Los impuestos se calcularán automáticamente');

console.log('\n✅ Resultado: El cliente pagará exactamente €29 y €290 como deseas.');