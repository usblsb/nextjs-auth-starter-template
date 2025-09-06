// Archivo temporal para verificar modelos de Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verificar qué modelos están disponibles
console.log('Modelos disponibles en Prisma Client:');
console.log(Object.getOwnPropertyNames(prisma).filter(name => 
  typeof prisma[name] === 'object' && 
  prisma[name] !== null && 
  'create' in prisma[name]
));

// Cerrar conexión
prisma.$disconnect();