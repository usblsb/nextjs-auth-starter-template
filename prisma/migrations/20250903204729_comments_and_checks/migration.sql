-- Migración para añadir comentarios y restricciones CHECK a las tablas de billing

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

COMMENT ON COLUMN "user_billing_plans"."id" IS 'Identificador único del plan de facturación';
COMMENT ON COLUMN "user_billing_plans"."name" IS 'Nombre descriptivo del plan (ej: Basic, Pro, Enterprise)';
COMMENT ON COLUMN "user_billing_plans"."description" IS 'Descripción detallada de las características del plan';
COMMENT ON COLUMN "user_billing_plans"."price_monthly" IS 'Precio mensual del plan en céntimos de euro';
COMMENT ON COLUMN "user_billing_plans"."price_annual" IS 'Precio anual del plan en céntimos de euro (con descuento)';
COMMENT ON COLUMN "user_billing_plans"."stripe_price_id_monthly" IS 'ID del precio mensual en Stripe para integración de pagos';
COMMENT ON COLUMN "user_billing_plans"."stripe_price_id_annual" IS 'ID del precio anual en Stripe para integración de pagos';
COMMENT ON COLUMN "user_billing_plans"."features" IS 'Características del plan en formato JSON';
COMMENT ON COLUMN "user_billing_plans"."is_active" IS 'Indica si el plan está disponible para nuevas suscripciones';
COMMENT ON COLUMN "user_billing_plans"."created_at" IS 'Fecha y hora de creación del plan';
COMMENT ON COLUMN "user_billing_plans"."updated_at" IS 'Fecha y hora de última actualización del plan';

-- ===== COMENTARIOS DE COLUMNAS - USER_SUBSCRIPTIONS =====

COMMENT ON COLUMN "user_subscriptions"."id" IS 'Identificador único de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."user_id" IS 'ID del usuario propietario de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."plan_id" IS 'ID del plan de facturación asociado';
COMMENT ON COLUMN "user_subscriptions"."stripe_subscription_id" IS 'ID de la suscripción en Stripe para gestión de pagos';
COMMENT ON COLUMN "user_subscriptions"."stripe_customer_id" IS 'ID del cliente en Stripe asociado al usuario';
COMMENT ON COLUMN "user_subscriptions"."status" IS 'Estado actual de la suscripción (trialing, active, past_due, canceled, etc.)';
COMMENT ON COLUMN "user_subscriptions"."billing_period" IS 'Período de facturación: monthly (mensual) o annual (anual)';
COMMENT ON COLUMN "user_subscriptions"."current_period_start" IS 'Inicio del período de facturación actual';
COMMENT ON COLUMN "user_subscriptions"."current_period_end" IS 'Final del período de facturación actual';
COMMENT ON COLUMN "user_subscriptions"."trial_end" IS 'Fecha de finalización del período de prueba (si aplica)';
COMMENT ON COLUMN "user_subscriptions"."canceled_at" IS 'Fecha de cancelación de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."created_at" IS 'Fecha y hora de creación de la suscripción';
COMMENT ON COLUMN "user_subscriptions"."updated_at" IS 'Fecha y hora de última actualización de la suscripción';

-- ===== COMENTARIOS DE COLUMNAS - USER_BILLING_ADDRESS =====

COMMENT ON COLUMN "user_billing_address"."id" IS 'Identificador único de la dirección de facturación';
COMMENT ON COLUMN "user_billing_address"."user_id" IS 'ID del usuario propietario de la dirección';
COMMENT ON COLUMN "user_billing_address"."company_name" IS 'Nombre de la empresa (opcional, para facturación empresarial)';
COMMENT ON COLUMN "user_billing_address"."tax_id" IS 'NIF/CIF para facturación española';
COMMENT ON COLUMN "user_billing_address"."full_name" IS 'Nombre completo del titular de la facturación';
COMMENT ON COLUMN "user_billing_address"."address_line_1" IS 'Línea principal de la dirección';
COMMENT ON COLUMN "user_billing_address"."address_line_2" IS 'Línea secundaria de la dirección (opcional)';
COMMENT ON COLUMN "user_billing_address"."city" IS 'Ciudad de la dirección de facturación';
COMMENT ON COLUMN "user_billing_address"."state_province" IS 'Provincia o comunidad autónoma';
COMMENT ON COLUMN "user_billing_address"."postal_code" IS 'Código postal para determinar IGIC (Canarias) o IVA (resto de España)';
COMMENT ON COLUMN "user_billing_address"."country" IS 'País de la dirección (por defecto ES para España)';
COMMENT ON COLUMN "user_billing_address"."is_default" IS 'Indica si es la dirección de facturación por defecto del usuario';
COMMENT ON COLUMN "user_billing_address"."created_at" IS 'Fecha y hora de creación de la dirección';
COMMENT ON COLUMN "user_billing_address"."updated_at" IS 'Fecha y hora de última actualización de la dirección';

-- ===== COMENTARIOS DE COLUMNAS - USER_ACTIVITY_LOG =====

COMMENT ON COLUMN "user_activity_log"."id" IS 'Identificador único del registro de actividad';
COMMENT ON COLUMN "user_activity_log"."user_id" IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN "user_activity_log"."action" IS 'Tipo de acción realizada (login, logout, payment, etc.)';
COMMENT ON COLUMN "user_activity_log"."description" IS 'Descripción detallada de la acción realizada';
COMMENT ON COLUMN "user_activity_log"."ip_address" IS 'Dirección IP desde la cual se realizó la acción';
COMMENT ON COLUMN "user_activity_log"."user_agent" IS 'User Agent del navegador para identificar dispositivo y navegador';
COMMENT ON COLUMN "user_activity_log"."metadata" IS 'Información adicional en formato JSON (IDs afectados, valores anteriores, etc.)';
COMMENT ON COLUMN "user_activity_log"."created_at" IS 'Fecha y hora exacta de la acción';

-- ===== COMENTARIOS DE COLUMNAS - USER_PERMISSIONS =====

COMMENT ON COLUMN "user_permissions"."id" IS 'Identificador único del permiso';
COMMENT ON COLUMN "user_permissions"."user_id" IS 'ID del usuario al que se otorga el permiso';
COMMENT ON COLUMN "user_permissions"."permission_type" IS 'Tipo de permiso (feature, resource, action, etc.)';
COMMENT ON COLUMN "user_permissions"."permission_value" IS 'Valor específico del permiso (nombre de feature, ID de recurso, etc.)';
COMMENT ON COLUMN "user_permissions"."granted_by" IS 'ID del usuario que otorgó este permiso';
COMMENT ON COLUMN "user_permissions"."granted_at" IS 'Fecha y hora en que se otorgó el permiso';
COMMENT ON COLUMN "user_permissions"."expires_at" IS 'Fecha de expiración del permiso (NULL para permisos permanentes)';
COMMENT ON COLUMN "user_permissions"."is_active" IS 'Indica si el permiso está actualmente activo';
COMMENT ON COLUMN "user_permissions"."created_at" IS 'Fecha y hora de creación del registro de permiso';
COMMENT ON COLUMN "user_permissions"."updated_at" IS 'Fecha y hora de última actualización del permiso';

-- ===== RESTRICCIONES CHECK =====

-- Restricción CHECK para el estado de suscripciones
ALTER TABLE "user_subscriptions" 
ADD CONSTRAINT "chk_subscription_status" 
CHECK ("status" IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'));

-- Restricción CHECK para el período de facturación
ALTER TABLE "user_subscriptions" 
ADD CONSTRAINT "chk_billing_period" 
CHECK ("billing_period" IS NULL OR "billing_period" IN ('monthly', 'annual'));