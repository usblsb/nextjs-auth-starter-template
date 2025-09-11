import { PrismaClient as PrismaClientDB2 } from '@prisma/client-db2'

declare global {
  var __db2: PrismaClientDB2 | undefined
}

let db2: PrismaClientDB2

if (process.env.NODE_ENV === 'production') {
  db2 = new PrismaClientDB2()
} else {
  if (!global.__db2) {
    global.__db2 = new PrismaClientDB2()
  }
  db2 = global.__db2
}

export { db2 }