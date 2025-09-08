/**
 * Script para importar precios desde el CSV de Stripe
 * Ejecutar: npx tsx scripts/import-from-csv.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

// Ruta al archivo CSV descargado de Stripe
const CSV_PATH = '/Users/juanluismartel/Downloads/products.csv';

function parseCSV(csvContent: string) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  });
}

async function importFromCSV() {
  console.log('📁 Importando precios desde CSV de Stripe...\n');

  try {
    // Leer archivo CSV
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const products = parseCSV(csvContent);

    console.log(`📊 Encontrados ${products.length} productos en CSV:`);
    
    // Mostrar productos encontrados
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name || product.nickname || 'Sin nombre'}`);
      console.log(`   Price ID: ${product.id || 'No encontrado'}`);
      console.log(`   Precio: €${(parseInt(product.unit_amount || '0') / 100)}`);
      console.log(`   Intervalo: ${product['recurring.interval'] || 'No recurrente'}`);
      console.log('');
    });

    // Buscar plan premium mensual (€29.00 = 2900 centavos)
    const monthlyPlan = products.find(p => 
      parseInt(p.unit_amount || '0') === 2900 && 
      p['recurring.interval'] === 'month'
    );

    // Buscar plan premium anual (€290.00 = 29000 centavos)
    const annualPlan = products.find(p => 
      parseInt(p.unit_amount || '0') === 29000 && 
      p['recurring.interval'] === 'year'
    );

    if (monthlyPlan) {
      console.log('✅ Plan Premium Mensual encontrado:', monthlyPlan.id);
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium' },
        data: {
          stripePriceId: monthlyPlan.id,
          stripeProductId: monthlyPlan.product || monthlyPlan.id.replace('price_', 'prod_'),
        },
      });
    } else {
      console.log('⚠️ Plan Premium Mensual (€29.00) no encontrado en CSV');
    }

    if (annualPlan) {
      console.log('✅ Plan Premium Anual encontrado:', annualPlan.id);
      await prisma.userBillingPlan.update({
        where: { planKey: 'premium_annual' },
        data: {
          stripePriceId: annualPlan.id,
          stripeProductId: annualPlan.product || annualPlan.id.replace('price_', 'prod_'),
        },
      });
    } else {
      console.log('⚠️ Plan Premium Anual (€290.00) no encontrado en CSV');
    }

    // Verificar actualizaciones
    const updatedPlans = await prisma.userBillingPlan.findMany({
      where: { planKey: { in: ['premium', 'premium_annual'] } }
    });

    console.log('\n📊 Estado final:');
    updatedPlans.forEach(plan => {
      const status = plan.stripePriceId.includes('placeholder') ? '❌ Sin configurar' : '✅ Configurado';
      console.log(`  • ${plan.name}: ${plan.stripePriceId} ${status}`);
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.error('❌ No se pudo encontrar el archivo CSV en:', CSV_PATH);
      console.log('\n💡 Opciones:');
      console.log('  1. Verifica que el archivo existe en esa ruta');
      console.log('  2. O compárteme los Price IDs manualmente');
    } else {
      console.error('❌ Error importando CSV:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
importFromCSV();