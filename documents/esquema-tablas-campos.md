# Esquema de Base de Datos - Tablas y Campos

## Resumen General
Este documento describe la estructura completa de las 5 tablas del sistema de facturación y usuarios.

---

## 1. Tabla: `user_billing_plans`
**Descripción**: Catálogo maestro de planes de facturación disponibles

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `planKey` | VARCHAR(50) | PRIMARY KEY | Identificador único del plan |
| `name` | VARCHAR(100) | NOT NULL | Nombre del plan |
| `description` | TEXT | NULLABLE | Descripción del plan |
| `stripePriceId` | VARCHAR(100) | UNIQUE, NOT NULL | ID del precio en Stripe |
| `stripeProductId` | VARCHAR(100) | NOT NULL | ID del producto en Stripe |
| `price` | DECIMAL(10,2) | NOT NULL | Precio del plan |
| `currency` | VARCHAR(3) | NOT NULL | Moneda (ISO 4217) |
| `interval` | VARCHAR(20) | NOT NULL | Periodicidad (monthly, yearly) |
| `isActive` | BOOLEAN | DEFAULT true | Estado activo del plan |
| `meta` | JSON | NULLABLE | Metadatos adicionales |
| `createdAt` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updatedAt` | TIMESTAMPTZ | AUTO UPDATE | Fecha de actualización |

**Índices**:
- `isActive`
- `stripePriceId`

---

## 2. Tabla: `user_subscriptions`
**Descripción**: Suscripciones activas de los usuarios

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID único de suscripción |
| `userId` | VARCHAR(50) | NOT NULL | ID del usuario en Clerk |
| `stripeCustomerId` | VARCHAR(100) | NOT NULL | ID del cliente en Stripe |
| `stripeSubscriptionId` | VARCHAR(100) | UNIQUE, NOT NULL | ID de suscripción en Stripe |
| `stripePriceId` | VARCHAR(100) | NOT NULL, FOREIGN KEY | ID del precio en Stripe |
| `status` | VARCHAR(20) | NOT NULL | Estado de suscripción |
| `interval` | VARCHAR(20) | NOT NULL | Periodicidad |
| `currentPeriodStart` | TIMESTAMPTZ | NOT NULL | Inicio del período actual |
| `currentPeriodEnd` | TIMESTAMPTZ | NOT NULL | Fin del período actual |
| `features` | VARCHAR(50)[] | ARRAY | Características incluidas |
| `raw` | JSON | NULLABLE | Datos completos de Stripe |
| `createdAt` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updatedAt` | TIMESTAMPTZ | AUTO UPDATE | Fecha de actualización |

**Relaciones**:
- `stripePriceId` → `user_billing_plans.stripePriceId`

**Índices**:
- `userId`
- `stripePriceId`
- `status`
- `stripeCustomerId`

---

## 3. Tabla: `user_billing_address`
**Descripción**: Direcciones de facturación de los usuarios

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID único de dirección |
| `userId` | VARCHAR(50) | NOT NULL | ID del usuario en Clerk |
| `country` | VARCHAR(2) | NOT NULL | Código de país (ISO 3166-1) |
| `state` | VARCHAR(100) | NULLABLE | Estado o provincia |
| `city` | VARCHAR(100) | NOT NULL | Ciudad |
| `postalCode` | VARCHAR(20) | NOT NULL | Código postal |
| `addressLine1` | VARCHAR(200) | NOT NULL | Línea de dirección 1 |
| `addressLine2` | VARCHAR(200) | NULLABLE | Línea de dirección 2 |
| `fullAddress` | TEXT | NOT NULL | Dirección completa formateada |
| `createdAt` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updatedAt` | TIMESTAMPTZ | AUTO UPDATE | Fecha de actualización |

**Índices**:
- `userId`
- `country`

---

## 4. Tabla: `user_activity_log`
**Descripción**: Registro de actividades y auditoría de usuarios

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID único de actividad |
| `userId` | VARCHAR(50) | NOT NULL | ID del usuario en Clerk |
| `action` | VARCHAR(120) | NOT NULL | Acción realizada |
| `ipAddress` | VARCHAR(45) | NULLABLE | Dirección IP (IPv6 compatible) |
| `userAgent` | TEXT | NULLABLE | User Agent del navegador |
| `metadata` | JSON | NULLABLE | Metadatos adicionales |
| `sessionId` | VARCHAR(100) | NULLABLE | ID de sesión |
| `resourceId` | VARCHAR(100) | NULLABLE | ID del recurso afectado |
| `resourceType` | VARCHAR(50) | NULLABLE | Tipo de recurso |
| `createdAt` | TIMESTAMPTZ | DEFAULT now() | Fecha de la actividad |

**Índices**:
- `userId`
- `action`
- `createdAt`
- `userId, createdAt` (compuesto)

---

## 5. Tabla: `user_permissions`
**Descripción**: Permisos y roles granulares por usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO INCREMENT | ID único de permiso |
| `userId` | VARCHAR(50) | NOT NULL | ID del usuario en Clerk |
| `type` | VARCHAR(50) | NOT NULL | Tipo de permiso |
| `value` | VARCHAR(100) | NOT NULL | Valor del permiso |
| `expiresAt` | TIMESTAMPTZ | NULLABLE | Fecha de expiración |
| `createdAt` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updatedAt` | TIMESTAMPTZ | AUTO UPDATE | Fecha de actualización |

**Índices**:
- `userId`
- `type`
- `userId, type` (compuesto)
- `expiresAt`

---

## Resumen de Tipos de Datos Utilizados

| Tipo PostgreSQL | Descripción | Uso Principal |
|-----------------|-------------|---------------|
| `BIGINT` | Entero de 64 bits | IDs primarios |
| `VARCHAR(n)` | Cadena variable hasta n caracteres | Textos cortos |
| `TEXT` | Cadena de longitud variable | Textos largos |
| `DECIMAL(10,2)` | Número decimal con 10 dígitos, 2 decimales | Precios |
| `BOOLEAN` | Verdadero/Falso | Estados activos |
| `JSON` | Datos en formato JSON | Metadatos flexibles |
| `TIMESTAMPTZ` | Fecha y hora con zona horaria | Timestamps |
| `VARCHAR(n)[]` | Array de cadenas | Listas de características |

---

## Notas Importantes

1. **Integración con Clerk**: Todas las tablas usan `userId` como referencia al sistema de autenticación Clerk
2. **Integración con Stripe**: Las tablas de facturación incluyen campos específicos para Stripe
3. **Auditoría**: La tabla `user_activity_log` proporciona trazabilidad completa
4. **Flexibilidad**: Los campos JSON permiten almacenar datos adicionales sin cambios de schema
5. **Escalabilidad**: Uso de BIGINT para IDs primarios permite gran volumen de registros