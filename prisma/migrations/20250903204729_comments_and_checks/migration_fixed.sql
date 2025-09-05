-- Migración corregida para añadir comentarios y restricciones CHECK a las tablas de billing

-- ===== COMENTARIOS DE TABLAS =====

-- Tabla de planes de facturación disponibles para usuarios
COMMENT ON TABLE "user_billing_plans" IS 'Planes de facturación disponibles para usuarios con precios y características específicas';

-- Tabla de suscripciones activas de usuarios
COMMENT ON TABLE "user_subscriptions" IS 'Suscripciones activas de usuarios vinculadas con Stripe para gestión de pagos';

-- Tabla de direcciones de facturación para cálculo de impuestos españoles
COMMENT ON TABLE "user_billing_address" IS 'Direcciones de facturación de usuarios para cálculo correcto de IGIC/IVA según legislación española';

-- Tabla de registro de actividad para auditoría
COMMENT ON TABLE "user_activity_log" IS 'Registro completo de actividad de usuarios para auditoría y seguimiento de acciones';

-- Tabla de permisos granulares de usuario
COMMENT ON TABLE "user_permissions" IS 'Sistema de permisos granulares para control de acceso detallado por usuario';

-- ===== COMENTARIOS DE COLUMNAS - USER_BILLING_PLANS =====

COMMENT ON COLUMN "user_billing_plans"."planKey" IS 'Identificador único del plan de facturación';
COMMENT ON COLUMN "user_billing_plans"."name" IS 'Nombre descriptivo del plan (ej: Basic, Pro, Enterprise)';
COMMENT ON COLUMN "user_billing_plans"."description" IS 'Descripción detallada de las características del plan';
COMMENT ON COLUMN "user_billing_plans"."stripePriceId" IS 'ID del precio en Stripe para integración de pagos';
COMMENT ON COLUMN "user_billing_plans"."stripeProductId" IS 'ID del producto en Stripe para integración de pagos';
COMMENT ON COLUMN "user_billing_plans"."price" IS 'Precio del plan en euros';
COMMENT ON COLUMN "user_billing_plans"."currency" IS 'Moneda del precio (EUR para euros)';
COMMENT ON COLUMN "user_billing_plans"."interval" IS 'Intervalo de facturación (month, year)';
COMMENT ON COLUMN "user_billing_plans"."isActive" IS 'Indica si el plan está disponible para nuevas suscripciones';
COMMENT ON COLUMN "user_billing_plans"."meta" IS 'Metadatos adicionales del plan en formato JSON';
COMMENT ON COLUMN "user_billing_plans"."createdAt" IS 'Fecha y hora de creación del plan';
COMMENT ON COLUMN "user_billing_plans"."updatedAt" IS 'Fecha y hora de última actualización del plan';

-- ===== COMENTARIOS DE COLUMNAS - USER_SUBSCRIPTIONS =====

COMMENT ON COLUMN "user_subscriptions"."id" IS 'Identificador único de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."userId" IS 'ID del usuario propietario de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."stripeCustomerId" IS 'ID del cliente en Stripe asociado al usuario';
COMMENT ON COLUMN "user_subscriptions"."stripeSubscriptionId" IS 'ID de la suscripción en Stripe para gestión de pagos';
COMMENT ON COLUMN "user_subscriptions"."stripePriceId" IS 'ID del precio en Stripe asociado a la suscripción';
COMMENT ON COLUMN "user_subscriptions"."status" IS 'Estado actual de la suscripción (trialing, active, past_due, canceled, etc.)';
COMMENT ON COLUMN "user_subscriptions"."interval" IS 'Intervalo de facturación: month (mensual) o year (anual)';
COMMENT ON COLUMN "user_subscriptions"."currentPeriodStart" IS 'Inicio del período de facturación actual';
COMMENT ON COLUMN "user_subscriptions"."currentPeriodEnd" IS 'Final del período de facturación actual';
COMMENT ON COLUMN "user_subscriptions"."features" IS 'Array de características incluidas en la suscripción';
COMMENT ON COLUMN "user_subscriptions"."raw" IS 'Datos raw de Stripe en formato JSON';
COMMENT ON COLUMN "user_subscriptions"."createdAt" IS 'Fecha y hora de creación de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."updatedAt" IS 'Fecha y hora de última actualización de la suscripción';

-- ===== RESTRICCIONES CHECK =====

-- Restricción CHECK para el estado de suscripciones
ALTER TABLE "user_subscriptions" 
ADD CONSTRAINT "chk_subscription_status" 
CHECK ("status" IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'));

-- Restricción CHECK para el intervalo de facturación en user_subscriptions
ALTER TABLE "user_subscriptions" 
ADD CONSTRAINT "chk_subscription_interval" 
CHECK ("interval" IN ('month', 'year'));

-- Restricción CHECK para el intervalo de facturación en user_billing_plans
ALTER TABLE "user_billing_plans" 
ADD CONSTRAINT "chk_plan_interval" 
CHECK ("interval" IN ('month', 'year'));

-- Restricción CHECK para la moneda
ALTER TABLE "user_billing_plans" 
ADD CONSTRAINT "chk_currency" 
CHECK ("currency" IN ('EUR', 'USD'));

-- Restricción CHECK para precios positivos
ALTER TABLE "user_billing_plans" 
ADD CONSTRAINT "chk_positive_price" 
CHECK ("price" > 0);