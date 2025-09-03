# Prompt para configuración de Prisma con Neon.com

Necesito configurar Prisma ORM para conectarme a una base de datos PostgreSQL en Neon.com para gestionar datos de usuarios, suscripciones y logs de actividad.

## Requisitos de conexión:

- Base de datos: Neon.com PostgreSQL 17
- Nombres de las Variables de entorno disponibles en .env:
  DB_HOST=""
  DB_PORT=""
  DB_NAME=""
  DB_USER=""
  DB_PASSWORD=""

## Especificaciones del esquema:

- Prefijo de tablas: `user_`
- Todas las tablas deben tener ID único como primary key
- Usar tipos de datos PostgreSQL apropiados
- Timestamps automáticos (createdAt, updatedAt)
- **IMPORTANTE: Añadir comentarios descriptivos en tablas y columnas usando la sintaxis de PostgreSQL**

## Tablas requeridas con comentarios:

### user_subscriptions

**Comentario tabla:** "Gestión de suscripciones de usuarios integrado con Stripe y Clerk"

- ID único (comentario: "Identificador único de la suscripción")
- user_id (string) - ID de Clerk (comentario: "ID único del usuario desde Clerk")
- stripe_customer_id (string, opcional) (comentario: "ID del cliente en Stripe")
- stripe_subscription_id (string, opcional) (comentario: "ID de la suscripción en Stripe")
- plan_type (enum: "plata", "oro", "premium") (comentario: "Tipo de plan contratado")
- billing_period (enum: "monthly", "annual") (comentario: "Periodicidad de facturación")
- status (enum: "active", "canceled", "past_due", "unpaid") (comentario: "Estado actual de la suscripción")
- current_period_end (datetime, opcional) (comentario: "Fecha fin del período actual")
- features (array de strings, opcional) (comentario: "Lista de características disponibles para este plan")
- created_at, updated_at (comentarios: "Fecha de creación/actualización del registro")

### user_billing_address

**Comentario tabla:** "Direcciones de facturación para cálculo correcto de impuestos españoles"

- ID único (comentario: "Identificador único de la dirección")
- user_id (string) - FK a usuario (comentario: "ID del usuario propietario de esta dirección")
- country (string) (comentario: "Código de país ISO")
- state (string, opcional) (comentario: "Provincia o estado")
- city (string, opcional) (comentario: "Ciudad de facturación")
- postal_code (string, opcional) (comentario: "Código postal para determinar IGIC vs IVA")
- full_address (text, opcional) (comentario: "Dirección completa de facturación")
- created_at, updated_at

### user_activity_log

**Comentario tabla:** "Registro de actividad y auditoría de acciones de usuarios"

- ID único (comentario: "Identificador único del log")
- user_id (string) - ID de Clerk (comentario: "ID del usuario que realizó la acción")
- action (string) - tipo de acción realizada (comentario: "Descripción de la acción realizada")
- timestamp (datetime) (comentario: "Momento exacto de la acción")
- ip_address (string, opcional) (comentario: "Dirección IP desde donde se realizó la acción")
- user_agent (string, opcional) (comentario: "Navegador/dispositivo utilizado")
- metadata (JSON, opcional) - datos adicionales (comentario: "Información adicional contextual de la acción")
- created_at (comentario: "Fecha de creación del registro de log")

### user_permissions

**Comentario tabla:** "Permisos y roles específicos de usuario"

- ID único (comentario: "Identificador único del permiso")
- user_id (string) - ID de Clerk (comentario: "ID del usuario al que se asigna el permiso")
- permission_type (string) (comentario: "Tipo de permiso otorgado")
- permission_value (string) (comentario: "Valor específico del permiso")
- expires_at (datetime, opcional) (comentario: "Fecha de expiración del permiso")
- created_at, updated_at

Por favor genera:

1. El archivo schema.prisma completo con comentarios en cada tabla y columna
2. La configuración de DATABASE_URL usando las variables de entorno
3. Los comandos SQL COMMENT para añadir comentarios a tablas y columnas después de la migración
4. Los comandos necesarios para inicializar y migrar
5. Ejemplo básico de uso para crear/consultar registros
6. Configuración de índices para optimizar consultas frecuentes por user_id
7. Consultas SQL para verificar que los comentarios se aplicaron correctamente
