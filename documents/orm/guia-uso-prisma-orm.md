# Guía de Uso Prisma ORM - Normas para LLM

## 1. Conceptos Básicos

**Prisma ORM** es un toolkit de base de datos que incluye:

- **Prisma Client**: Cliente de base de datos auto-generado y type-safe
- **Prisma Migrate**: Sistema de migraciones declarativo
- **Prisma Studio**: GUI para visualizar y editar datos

## 2. Comandos Esenciales

### Comandos de Desarrollo

```bash
# Generar cliente Prisma después de cambios en schema
npx prisma generate

# Sincronizar schema con BD (desarrollo)
npx prisma db push

# Crear y aplicar migraciones (producción)
npx prisma migrate dev

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Reset completo de BD
npx prisma migrate reset
```

### Scripts package.json Configurados

```bash
pnpm db:generate  # Genera cliente
pnpm db:push      # Sincroniza schema
pnpm db:migrate   # Crea migración
pnpm db:studio    # Abre Studio
pnpm db:reset     # Reset BD
```

## 3. Estructura del Schema

### Configuración Base

```prisma
generator client {
  provider = "prisma-client-js"
  // NO agregar output personalizado en Next.js 15
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Para Neon.com: URL debe incluir sslmode=require
}
```

## 4. Normas para Creación de Tablas

### Nomenclatura

- **Modelos**: PascalCase (`User`, `BlogPost`)
- **Campos**: camelCase (`firstName`, `createdAt`)
- **Tablas BD**: OBLIGATORIO prefijo `user_` + snake_case (`user_profiles`, `user_posts`)

### ⚠️ ADVERTENCIA CRÍTICA - Prefijos de Tablas

**NUNCA tocar tablas con prefijo `els_`** - Son del backend Python existente

**SIEMPRE usar prefijo `user_`** para todas las tablas de esta aplicación:

```prisma
model User {
  id    String @id @default(cuid())
  // Genera tabla: user_users (automático)
  @@map("user_profiles") // Mapeo manual recomendado
}

model Post {
  id String @id @default(cuid())
  @@map("user_posts")
}
```

### Campos Obligatorios

```prisma
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Campos específicos del modelo
  email     String   @unique
  name      String?

  // OBLIGATORIO: Mapear tabla con prefijo user_
  @@map("user_profiles")
}
```

### Tipos de Datos Comunes

- **ID**: `String @id @default(cuid())` o `Int @id @default(autoincrement())`
- **Texto**: `String` (requerido) o `String?` (opcional)
- **Números**: `Int`, `Float`, `Decimal`
- **Fechas**: `DateTime @default(now())`, `DateTime @updatedAt`
- **Booleanos**: `Boolean @default(false)`
- **JSON**: `Json` (PostgreSQL)

## 5. Relaciones

### Uno a Muchos

```prisma
model User {
  id    String @id @default(cuid())
  posts Post[]

  @@map("user_profiles")
}

model Post {
  id       String @id @default(cuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  @@map("user_posts")
}
```

### Muchos a Muchos

```prisma
model Post {
  id         String     @id @default(cuid())
  categories Category[]

  @@map("user_posts")
}

model Category {
  id    String @id @default(cuid())
  posts Post[]

  @@map("user_categories")
}
```

## 6. Consideraciones Importantes

### Para Desarrollo

- Usar `db push` para cambios rápidos en desarrollo
- Usar `migrate dev` para cambios que van a producción
- Siempre ejecutar `generate` después de cambios en schema

### Para Producción

- Solo usar `migrate deploy`
- Nunca usar `db push` en producción
- Hacer backup antes de migraciones

### Conexión Neon.com

- DATABASE_URL debe incluir `sslmode=require`
- Formato: `postgresql://user:pass@host:port/db?sslmode=require`
- Variables en .env: `DB_HOST`, `DB1_USER`, `DB1_PASSWORD`, `DB1_NAME`

## 7. Flujo de Trabajo Recomendado

1. **Modificar** `schema.prisma`
2. **Ejecutar** `pnpm db:push` (desarrollo) o `pnpm db:migrate` (producción)
3. **Generar** cliente con `pnpm db:generate`
4. **Verificar** cambios en `pnpm db:studio`
5. **Usar** cliente en código TypeScript

## 8. Errores Comunes a Evitar

- **CRÍTICO**: No crear tablas sin prefijo `user_` (usar `@@map("user_nombre")`)
- **CRÍTICO**: NUNCA modificar/crear tablas con prefijo `els_`
- No agregar `output` personalizado en generador (causa errores Next.js 15)
- No olvidar `@updatedAt` en campos de fecha de actualización
- No usar `db push` en producción
- No olvidar ejecutar `generate` después de cambios
- Verificar que DATABASE_URL tenga SSL para Neon.com
- Siempre usar `@@map()` para controlar nombres de tablas explícitamente

## 9. Integración con Next.js 15

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Esta configuración evita múltiples instancias de Prisma Client en desarrollo.
