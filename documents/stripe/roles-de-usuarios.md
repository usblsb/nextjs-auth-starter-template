El proyecto consta de dos base de datos de PosgreSQL alojadas en NEON.COM

La base de dados [DB1] que es la que se usa en esta APP guarda datos de usuarios registros de log, pagos y suscripciones, todo ello obtenido desde CLERK y STRIPE.
La base de dados [DB2] guarda contenidos de diapositivas, lecciones y cursos y es de solo lectura.

Este proyecto muestra el contenido desde la base de dados [DB2], según sea el estado del usuario muestra mas o menos contenido, ejemplo:
Usuarios sin login: Ven el contenido en ABIERTO de la academia (GOOGEL SOLO VE ESTE CONTENIDO).
Usuarios GRATIS: ven el contenido en ABIERTO y el contenido GRATIS.
Usuarios PREMIUM: ven el contenido GRATIS y PREMIUM.

---

## Arquitectura de SaaS con gestión fiscal española automatizada

El proyecto ya tiene funcionando una solución completa de login logout utilizando
Clerk para autenticación de usuarios.

Necesito implementar Stripe para procesamiento de pagos con
gestión fiscal inteligente, usando la base de datos en neon.com (Frankfurt) como base de
datos principal para almacenar logs de actividad en [DB1], historial de suscripciones y
datos de negocio como son los datos de los usuarios obtenidos desde Clerk y Stripe y alamcenando los mismos en [DB1].

La característica diferencial a implementar en Stripe y en este proyecto es el sistema de **conmutación automática de impuestos**: debe detectar automáticamente si el cliente es de España continental (IVA 21% vía Stripe Tax) o Canarias (IGIC 7% vía Tax Rates manuales), aplicando la fiscalidad correcta según la dirección de facturación. Los usuarios pueden autogestionar sus suscripciones a través del Portal de Stripe, con sincronización bidireccional de datos entre Clerk y Stripe en [DB1] y usando las paginas de dashboard para incorporar el boton de acceso al Portal de Stripe asi como los botones de suscripcion, cancelacion de las suscripciones de Stripe.

La base de datos [DB1] permite almacenar el historial completo de actividad de
usuarios, cambios de suscripción y logs de auditoría que Clerk no mantiene
nativamente, asi como roles y datos de STRIPE en las tablas existentes.

En el fichero .env tenemos las siguientes variables de entorno con sus datos rellenados:

# DATOS DE CONEXION POSTGRESQL - NEON.COM Frankfurt [DB1]

DB1_HOST=""
DB1_PORT=""
DB1_NAME=""
DB1_USER=""
DB1_PASSWORD=""

# DB1_DATABASE_URL para Neon.com PostgreSQL con SSL

DATABASE*URL="postgresql://neondb*"

# DATOS DE STRIPE MODO TEST

STRIPE*API_KEY="sk_test*"

# DATOS DE API NEON.COM

NEON_API_KEY="napi_48"
