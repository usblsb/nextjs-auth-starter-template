# Documento Técnico: Implementación SaaS con Clerk, Stripe y Neon.com

## Fase 1: Configuración de Infraestructura Base

### Tareas:

- [ ] Configurar proyecto Neon.com en región Frankfurt
- [ ] Crear conexión Vercel-Neon mediante marketplace
- [ ] Configurar variables de entorno automáticas
- [ ] Diseñar esquema de base de datos:
  - Tabla `user_subscriptions` (user_id, stripe_customer_id, plan_type, status)
  - Tabla `user_activity_log` (user_id, action, timestamp, ip_address, metadata)
  - Tabla `user_billing_address` (user_id, country, state, postal_code, full_address)
- [ ] Implementar Row Level Security (RLS) policies
- [ ] Crear funciones SQL helper para consultas frecuentes
- [ ] Probar conexión desde aplicación Next.js

## Fase 2: Configuración Fiscal en Stripe

### Tareas:

- [ ] Activar Stripe Tax y registrar España continental en Dashboard
- [ ] Configurar tax codes para productos/servicios
- [ ] Crear Tax Rate manual "IGIC 7%" con jurisdiction="Canarias"
- [ ] Implementar lógica de detección geográfica:
  - Función detectar si CP empieza por 35xxx/38xxx
  - Función detectar provincia Las Palmas/Santa Cruz de Tenerife
- [ ] Configurar Stripe Tax como fallback (0% provisional con metadata)
- [ ] Probar flujos: España continental (auto) vs Canarias (manual)

## Fase 3: Página de Precios y Checkout

### Tareas:

- [ ] Diseñar página de precios con planes (Plata, Oro, Premium)
- [ ] Crear productos y precios en Stripe Dashboard
- [ ] Implementar Stripe Checkout con:
  - `billing_address_collection=required`
  - `automatic_tax.enabled=true` (por defecto)
  - Conmutación a manual si detecta Canarias
- [ ] Crear endpoint `/api/create-checkout-session`
- [ ] Implementar creación de Customer con email de Clerk
- [ ] Implementar lógica de redirección post-pago
- [ ] Añadir manejo de errores y validaciones

## Fase 4: Integración Stripe-Clerk Bidireccional

### Tareas:

- [ ] Configurar webhooks de Stripe:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.updated`
- [ ] Implementar endpoint `/api/stripe-webhook`
- [ ] Crear funciones de sincronización:
  - Stripe → Clerk (dirección a privateMetadata)
  - Clerk → Neon (datos de suscripción)
  - Clerk → Stripe (actualizar email si cambia)
- [ ] Implementar sistema de roles/permisos en privateMetadata:
  - Estructura: `{ subscription: { status, plan, features, billing_address } }`
- [ ] Crear middleware de autorización basado en suscripción
- [ ] Probar flujo completo de signup → pago → activación

## Fase 5: Portal de Cliente y Dashboard Personal

### Tareas:

- [ ] Configurar Stripe Customer Portal:
  - Habilitar update de address, email, tax_id
  - Activar cancellation, invoice_history, payment_methods
- [ ] Crear endpoint `/api/create-portal-session`
- [ ] Añadir botón "Gestionar Suscripción" en dashboard
- [ ] Implementar sección "Mi Suscripción" en dashboard:
  - Plan actual y características
  - Estado de pago
  - Próxima facturación
  - Historial de facturas
- [ ] Crear componente de estado de suscripción (activa, cancelada, impaga)
- [ ] Implementar protección de rutas por tipo de suscripción

## Fase 6: Sistema de Logs y Auditoría

### Tareas:

- [ ] Implementar logging automático en middleware:
  - Login/logout events
  - Cambios de suscripción
  - Acceso a funcionalidades premium
- [ ] Crear sistema de tracking de actividad:
  - IP address, user agent, timestamp
  - Acciones críticas (cambios de password, billing)
- [ ] Implementar dashboard de actividad para usuarios
- [ ] Crear queries optimizadas para reportes
- [ ] Implementar retención de datos (GDPR compliance)

## Fase 7: Control de Acceso y Permisos

### Tareas:

- [ ] Definir matriz de permisos por plan:
  - Plata: funciones básicas
  - Oro: funciones avanzadas
  - Premium: funciones completas
- [ ] Implementar hook `useSubscription()` para verificar acceso
- [ ] Crear componentes de UI condicional por suscripción
- [ ] Implementar límites de uso por plan (API calls, storage, etc.)
- [ ] Crear sistema de upgrade/downgrade automático
- [ ] Implementar notificaciones de límites alcanzados

## Fase 8: Manejo de Casos Especiales

### Tareas:

- [ ] Implementar manejo de cambio de región:
  - Webhook para detectar cambio Península ↔ Canarias
  - Actualización automática de tax configuration
- [ ] Crear flujo para clientes B2B con NIF-IVA
- [ ] Implementar validación estricta de códigos postales españoles
- [ ] Crear sistema de migración para suscripciones existentes
- [ ] Implementar fallback seguro para direcciones inválidas
- [ ] Añadir soporte para tax exemptions

## Fase 9: Testing y Optimización

### Tareas:

- [ ] Testing end-to-end de flujos completos
- [ ] Pruebas de webhook reliability y error handling
- [ ] Testing de performance con Neon
- [ ] Pruebas de sincronización Clerk-Stripe-Neon
- [ ] Validación de cálculos fiscales (21% vs 7%)
- [ ] Testing de Customer Portal integration
- [ ] Optimización de queries y índices en Neon

## Fase 10: Monitoreo y Deployment

### Tareas:

- [ ] Configurar monitoring y alertas
- [ ] Implementar health checks para servicios críticos
- [ ] Configurar backup strategy para Neon
- [ ] Documentar APIs y webhooks
- [ ] Crear runbooks para casos de emergencia
- [ ] Deploy a producción con feature flags
- [ ] Monitoreo post-deployment

---

**Dependencias críticas**: Orden secuencial requerido para Fases 1-4, resto pueden paralelizarse parcialmente.
