# Prisma + Neon (PostgreSQL 17) — Esquema “user\_\*” sin ENUM para Stripe

> Hipótesis: roles y planes de Stripe cambian. Evito `enum` en Prisma y uso `String` + `CHECK` (restricción lógica) y catálogo `user_billing_plans` (mapeo `stripe_price_id` → tu `plan_key`).
> Acción: esquema completo + SQL de comentarios y checks + comandos + ejemplo CRUD + índices.

---

## 1) `schema.prisma` completo

```prisma
// -------------------------------------------------------------------
// Prisma schema for Neon PostgreSQL 17
// Sin ENUM para Stripe. Catálogo user_billing_plans y suscripciones.
// -------------------------------------------------------------------

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DB1_DATABASE_URL") // Ver sección 2 (.env)
}

/// Catálogo interno de planes mapeados a Stripe (price/product)
model UserBillingPlan {
  /// Clave interna del plan (ej: 'basic','pro','premium')
  planKey           String           @id @map("plan_key")
  /// ID de precio en Stripe (price_...) único
  stripePriceId     String           @unique @map("stripe_price_id")
  /// ID de producto en Stripe (prod_...)
  stripeProductId   String           @map("stripe_product_id")
  /// Indicador de plan activo
  active            Boolean          @default(true)
  /// Metadatos en JSON (features, límites, etc.)
  meta              Json?            @map("meta")

  /// Suscripciones que referencian este plan vía stripe_price_id
  subscriptions     UserSubscription[]

  @@map("user_billing_plans")
}

/// Gestión de suscripciones integradas con Stripe y Clerk
model UserSubscription {
  /// Identificador único de la suscripción (BIGSERIAL)
  id                   BigInt   @id @default(autoincrement()) @map("id")
  /// ID único del usuario desde Clerk
  userId               String   @map("user_id")
  /// ID del cliente en Stripe (cus_...)
  stripeCustomerId     String?  @map("stripe_customer_id")
  /// ID de la suscripción en Stripe (sub_...), único si existe
  stripeSubscriptionId String?  @unique @map("stripe_subscription_id")
  /// ID de precio en Stripe (price_...) que determina el plan
  stripePriceId        String   @map("stripe_price_id")
  /// Periodicidad de facturación como texto ('monthly'|'annual'); validado por CHECK SQL
  billingPeriod        String?  @map("billing_period")
  /// Estado actual de la suscripción (texto). Validado por CHECK SQL.
  status               String   @map("status")
  /// Inicio de periodo actual
  currentPeriodStart   DateTime? @map("current_period_start")
  /// Fin de periodo actual
  currentPeriodEnd     DateTime? @map("current_period_end")
  /// Cancelación al final de periodo
  cancelAtPeriodEnd    Boolean   @default(false) @map("cancel_at_period_end")
  /// Lista de características habilitadas para esta suscripción (text[])
  features             String[]? @map("features")
  /// Payload íntegro recibido de Stripe para auditoría
  raw                  Json      @map("raw")
  /// Timestamps
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  /// Relación opcional al catálogo del plan, usando stripe_price_id
  plan UserBillingPlan? @relation(fields: [stripePriceId], references: [stripePriceId], onUpdate: NoAction, onDelete: SetNull)

  @@index([userId], map: "idx_user_subscriptions_user_id")
  @@index([stripePriceId], map: "idx_user_subscriptions_price_id")
  @@map("user_subscriptions")
}

/// Direcciones de facturación para cálculo correcto de impuestos españoles
model UserBillingAddress {
  /// Identificador único de la dirección (BIGSERIAL)
  id          BigInt   @id @default(autoincrement()) @map("id")
  /// ID del usuario propietario (Clerk)
  userId      String   @map("user_id")
  /// Código de país ISO (ej: 'ES')
  country     String   @db.VarChar(2) @map("country")
  /// Provincia o estado
  state       String?  @db.VarChar(100) @map("state")
  /// Ciudad de facturación
  city        String?  @db.VarChar(100) @map("city")
  /// Código postal (clave para IGIC vs IVA)
  postalCode  String?  @db.VarChar(20) @map("postal_code")
  /// Dirección completa de facturación
  fullAddress String?  @db.Text @map("full_address")
  /// Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([userId], map: "idx_user_billing_address_user_id")
  @@map("user_billing_address")
}

/// Registro de actividad y auditoría de acciones de usuarios
model UserActivityLog {
  /// Identificador único del log (BIGSERIAL)
  id         BigInt   @id @default(autoincrement()) @map("id")
  /// ID del usuario (Clerk)
  userId     String   @map("user_id")
  /// Descripción de la acción realizada
  action     String   @db.VarChar(120) @map("action")
  /// Momento exacto de la acción
  timestamp  DateTime @default(now()) @map("timestamp")
  /// Dirección IP
  ipAddress  String?  @db.VarChar(64) @map("ip_address")
  /// Navegador/dispositivo
  userAgent  String?  @db.VarChar(255) @map("user_agent")
  /// Información adicional contextual
  metadata   Json?    @map("metadata")
  /// Fecha de creación del registro
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId], map: "idx_user_activity_log_user_id")
  @@map("user_activity_log")
}

/// Permisos y roles específicos de usuario
model UserPermission {
  /// Identificador único del permiso (BIGSERIAL)
  id              BigInt   @id @default(autoincrement()) @map("id")
  /// ID del usuario (Clerk)
  userId          String   @map("user_id")
  /// Tipo de permiso otorgado
  permissionType  String   @db.VarChar(64)  @map("permission_type")
  /// Valor específico del permiso
  permissionValue String   @db.VarChar(128) @map("permission_value")
  /// Fecha de expiración del permiso
  expiresAt       DateTime? @map("expires_at")
  /// Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([userId], map: "idx_user_permissions_user_id")
  @@map("user_permissions")
}
```

---

## 2) SQL de comentarios (COMMENT) y restricciones CHECK

> Añade esto en una migración SQL posterior o ejecútalo con `psql`. Mantengo prefijo `user_` y comento **todas** las columnas pedidas. Incluyo `CHECK` para `status` y `billing_period` sin ENUM.

```sql
-- =====================================================================
-- Comentarios de tablas
-- =====================================================================
COMMENT ON TABLE public.user_billing_plans      IS 'Catálogo de planes propios mapeados a Stripe (price/product)';
COMMENT ON TABLE public.user_subscriptions      IS 'Gestión de suscripciones de usuarios integrado con Stripe y Clerk';
COMMENT ON TABLE public.user_billing_address    IS 'Direcciones de facturación para cálculo correcto de impuestos españoles';
COMMENT ON TABLE public.user_activity_log       IS 'Registro de actividad y auditoría de acciones de usuarios';
COMMENT ON TABLE public.user_permissions        IS 'Permisos y roles específicos de usuario';

-- =====================================================================
-- Comentarios de columnas: user_billing_plans
-- =====================================================================
COMMENT ON COLUMN public.user_billing_plans.plan_key          IS 'Clave interna del plan (ej: basic, pro, premium)';
COMMENT ON COLUMN public.user_billing_plans.stripe_price_id   IS 'ID de precio en Stripe (price_...)';
COMMENT ON COLUMN public.user_billing_plans.stripe_product_id IS 'ID de producto en Stripe (prod_...)';
COMMENT ON COLUMN public.user_billing_plans.active            IS 'Indicador de plan activo';
COMMENT ON COLUMN public.user_billing_plans.meta              IS 'Metadatos del plan en JSON';

-- =====================================================================
-- Comentarios de columnas: user_subscriptions
-- =====================================================================
COMMENT ON COLUMN public.user_subscriptions.id                     IS 'Identificador único de la suscripción';
COMMENT ON COLUMN public.user_subscriptions.user_id                IS 'ID único del usuario desde Clerk';
COMMENT ON COLUMN public.user_subscriptions.stripe_customer_id     IS 'ID del cliente en Stripe';
COMMENT ON COLUMN public.user_subscriptions.stripe_subscription_id IS 'ID de la suscripción en Stripe';
COMMENT ON COLUMN public.user_subscriptions.stripe_price_id        IS 'ID de precio en Stripe asociado al plan';
COMMENT ON COLUMN public.user_subscriptions.billing_period         IS 'Periodicidad de facturación (monthly|annual)';
COMMENT ON COLUMN public.user_subscriptions.status                 IS 'Estado actual de la suscripción';
COMMENT ON COLUMN public.user_subscriptions.current_period_start   IS 'Fecha inicio del período actual';
COMMENT ON COLUMN public.user_subscriptions.current_period_end     IS 'Fecha fin del período actual';
COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end   IS 'Cancelar al final del período actual';
COMMENT ON COLUMN public.user_subscriptions.features               IS 'Lista de características habilitadas (text[])';
COMMENT ON COLUMN public.user_subscriptions.raw                    IS 'Payload íntegro de Stripe para auditoría';
COMMENT ON COLUMN public.user_subscriptions.created_at             IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.user_subscriptions.updated_at             IS 'Fecha de actualización del registro';

-- =====================================================================
-- Comentarios de columnas: user_billing_address
-- =====================================================================
COMMENT ON COLUMN public.user_billing_address.id           IS 'Identificador único de la dirección';
COMMENT ON COLUMN public.user_billing_address.user_id      IS 'ID del usuario propietario de esta dirección';
COMMENT ON COLUMN public.user_billing_address.country      IS 'Código de país ISO';
COMMENT ON COLUMN public.user_billing_address.state        IS 'Provincia o estado';
COMMENT ON COLUMN public.user_billing_address.city         IS 'Ciudad de facturación';
COMMENT ON COLUMN public.user_billing_address.postal_code  IS 'Código postal para determinar IGIC vs IVA';
COMMENT ON COLUMN public.user_billing_address.full_address IS 'Dirección completa de facturación';
COMMENT ON COLUMN public.user_billing_address.created_at   IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.user_billing_address.updated_at   IS 'Fecha de actualización del registro';

-- =====================================================================
-- Comentarios de columnas: user_activity_log
-- =====================================================================
COMMENT ON COLUMN public.user_activity_log.id         IS 'Identificador único del log';
COMMENT ON COLUMN public.user_activity_log.user_id    IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN public.user_activity_log.action     IS 'Descripción de la acción realizada';
COMMENT ON COLUMN public.user_activity_log.timestamp  IS 'Momento exacto de la acción';
COMMENT ON COLUMN public.user_activity_log.ip_address IS 'Dirección IP desde donde se realizó la acción';
COMMENT ON COLUMN public.user_activity_log.user_agent IS 'Navegador/dispositivo utilizado';
COMMENT ON COLUMN public.user_activity_log.metadata   IS 'Información adicional contextual de la acción';
COMMENT ON COLUMN public.user_activity_log.created_at IS 'Fecha de creación del registro de log';

-- =====================================================================
-- Comentarios de columnas: user_permissions
-- =====================================================================
COMMENT ON COLUMN public.user_permissions.id               IS 'Identificador único del permiso';
COMMENT ON COLUMN public.user_permissions.user_id          IS 'ID del usuario al que se asigna el permiso';
COMMENT ON COLUMN public.user_permissions.permission_type  IS 'Tipo de permiso otorgado';
COMMENT ON COLUMN public.user_permissions.permission_value IS 'Valor específico del permiso';
COMMENT ON COLUMN public.user_permissions.expires_at       IS 'Fecha de expiración del permiso';
COMMENT ON COLUMN public.user_permissions.created_at       IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.user_permissions.updated_at       IS 'Fecha de actualización del registro';

-- =====================================================================
-- CHECK constraints para evitar ENUM en Prisma pero validar valores
-- =====================================================================
-- Estados de suscripción (puedes reducir a los que usas)
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT chk_user_subscriptions_status
  CHECK (status IN (
    'trialing','active','past_due','canceled',
    'incomplete','incomplete_expired','unpaid','paused'
  ));

-- Periodicidad (si usas mensual/anual)
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT chk_user_subscriptions_billing_period
  CHECK (billing_period IS NULL OR billing_period IN ('monthly','annual'));
```

---

## 3) Comandos para inicializar y migrar

```bash
# 1) Instalar dependencias
pnpm add -D prisma
pnpm add @prisma/client

# 2) Inicializar Prisma apuntando a PostgreSQL
npx prisma init --datasource-provider postgresql

# 3) Ajusta .env con DB_* y DB1_DATABASE_URL (ver sección 2)

# 4) Crear y aplicar la migración inicial (tablas/índices)
pnpm prisma migrate dev --name init_billing

# 5) Generar cliente
pnpm prisma generate

# 6) Crear migración sólo-SQL para comentarios y checks (edítala)
pnpm prisma migrate dev --create-only --name comments_and_checks

# 7) Abre el fichero SQL creado en prisma/migrations/**/migration.sql
#    y pega el bloque SQL de la sección 3. Guarda.

# 8) Aplicar migraciones (incluye comentarios y checks)
pnpm prisma migrate deploy
```

---

## 5) Ejemplo básico de uso (TypeScript, Prisma Client)

```ts
// prisma.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

```ts
// seed-or-usage.ts
import { prisma } from "./prisma";

// 1) Crear catálogo de plan mapeado a Stripe
await prisma.userBillingPlan.upsert({
	where: { planKey: "pro" },
	update: { active: true },
	create: {
		planKey: "pro",
		stripePriceId: "price_123",
		stripeProductId: "prod_abc",
		meta: { seats: 1, limits: { projects: 10 } },
	},
});

// 2) Upsert suscripción al llegar webhook Stripe
await prisma.userSubscription.upsert({
	where: { stripeSubscriptionId: "sub_999" },
	update: {
		status: "active",
		billingPeriod: "monthly",
		stripePriceId: "price_123",
		currentPeriodStart: new Date(),
		currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
		features: ["videos_hd", "support_priority"],
		raw: { webhook: "customer.subscription.updated" },
	},
	create: {
		userId: "user_clerk_1",
		stripeCustomerId: "cus_777",
		stripeSubscriptionId: "sub_999",
		stripePriceId: "price_123",
		status: "active",
		billingPeriod: "monthly",
		raw: { webhook: "customer.subscription.created" },
	},
});

// 3) Consultar suscripción + plan interno por usuario
const sub = await prisma.userSubscription.findFirst({
	where: { userId: "user_clerk_1", status: "active" },
	include: { plan: true },
});
console.log(sub?.plan?.planKey); // 'pro'
```

---

## 6) Índices (index) por `user_id`

- Ya definidos en el esquema:

  - `idx_user_subscriptions_user_id`
  - `idx_user_billing_address_user_id`
  - `idx_user_activity_log_user_id`
  - `idx_user_permissions_user_id`

---

## 7) Consultas SQL para verificar comentarios y checks

```sql
-- Comentario de tabla
SELECT obj_description('public.user_subscriptions'::regclass, 'pg_class') AS table_comment;

-- Comentarios de columnas
SELECT a.attname AS column,
       col_description(c.oid, a.attnum) AS comment
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relname = 'user_subscriptions' AND a.attnum > 0
ORDER BY a.attnum;

-- Ver restricciones CHECK
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.user_subscriptions'::regclass
  AND contype = 'c';
```

---

### Nota operativa

- `status` y `billing_period` se validan con `CHECK` en SQL (no `enum` en Prisma).
- El “tipo de plan” se deduce por `stripe_price_id` uniéndose a `user_billing_plans` (`plan_key`).
- `features` usa `text[]` (array de strings en PostgreSQL).
