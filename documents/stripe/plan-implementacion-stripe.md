# Plan de Implementación de Stripe - SaaS con Gestión Fiscal Española

## Resumen del Proyecto

**Objetivo**: Implementar Stripe para procesamiento de pagos con gestión fiscal inteligente para España, incluyendo conmutación automática de impuestos (IVA 21% continental / IGIC 7% Canarias).

**Arquitectura Actual**:
- ✅ Next.js 15 con Clerk Authentication
- ✅ Base de datos PostgreSQL en Neon.com (Frankfurt) [DB1]
- ✅ Esquema Prisma con tablas para suscripciones y billing
- ✅ Webhooks de Clerk funcionando

---

## FASE 1: Configuración Inicial de Stripe

### 1.1 Instalación y Configuración Base

#### ☐ Instalar dependencias de Stripe
```bash
pnpm add stripe @stripe/stripe-js
pnpm add -D @types/stripe
```

#### ☐ Configurar variables de entorno
- ✅ `STRIPE_API_KEY` (ya configurada en .env)
- ☐ Agregar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ☐ Agregar `STRIPE_WEBHOOK_SECRET`

#### ☐ Crear cliente de Stripe
- ☐ `lib/stripe/client.ts` (cliente servidor)
- ☐ `lib/stripe/config.ts` (configuración)

#### ☐ Configurar Stripe Dashboard
- ☐ Activar Stripe Tax para España
- ☐ Configurar Tax Rates manuales para Canarias (IGIC 7%)
- ☐ Crear productos y precios en Stripe Dashboard
- ☐ Configurar webhook endpoint para desarrollo con ngrok

---

## FASE 2: Integración con Base de Datos

### 2.1 Sincronización de Datos Stripe-BD

#### ☐ Validar esquema Prisma existente
- ✅ Tabla `UserBillingPlan` (productos Stripe)
- ✅ Tabla `UserSubscription` (suscripciones)
- ✅ Tabla `UserBillingAddress` (direcciones para fiscalidad)

#### ☐ Crear servicios de sincronización
- ☐ `lib/services/stripeService.ts` (operaciones Stripe)
- ☐ `lib/services/billingService.ts` (lógica de facturación)
- ☐ `lib/services/taxService.ts` (lógica fiscal española)

#### ☐ Poblar productos iniciales en BD
- ☐ Crear script de seed para UserBillingPlan
- ☐ Sincronizar precios desde Stripe Dashboard

---

## FASE 3: Sistema de Fiscalidad Inteligente

### 3.1 Detección Automática de Impuestos

#### ☐ Implementar lógica de detección fiscal
```typescript
// lib/services/taxService.ts
function detectTaxRate(billingAddress: UserBillingAddress): TaxConfig {
  if (billingAddress.country === 'ES') {
    // España Continental: IVA 21% via Stripe Tax
    if (isCanaryIslands(billingAddress.postalCode)) {
      // Canarias: IGIC 7% via Tax Rates manuales
      return { type: 'manual', rate: 0.07, description: 'IGIC' }
    }
    return { type: 'automatic', description: 'IVA via Stripe Tax' }
  }
  return { type: 'automatic', description: 'EU VAT via Stripe Tax' }
}
```

#### ☐ Crear función de validación de códigos postales Canarios
- ☐ Lista de códigos postales 35xxx y 38xxx (Las Palmas y Santa Cruz)
- ☐ Validación automática en tiempo real

#### ☐ Configurar Stripe Tax y Tax Rates
- ☐ Activar Stripe Tax para territorio continental español
- ☐ Crear Tax Rate manual para IGIC Canarias (7%)
- ☐ Configurar reglas de aplicación automática

---

## FASE 4: APIs de Pagos y Suscripciones

### 4.1 Endpoints de Suscripción

#### ☐ Crear API Routes
- ☐ `app/api/stripe/create-subscription/route.ts`
- ☐ `app/api/stripe/update-subscription/route.ts`
- ☐ `app/api/stripe/cancel-subscription/route.ts`
- ☐ `app/api/stripe/create-portal-session/route.ts`

#### ☐ Implementar flujo de checkout
```typescript
// Flujo básico:
// 1. Usuario selecciona plan
// 2. Detectar fiscalidad por dirección
// 3. Crear Customer en Stripe con metadata fiscal
// 4. Crear Subscription con tax config apropiada
// 5. Sincronizar con BD [DB1]
```

#### ☐ Gestión de Customer Portal
- ☐ Integrar Stripe Customer Portal
- ☐ Personalización para mercado español
- ☐ Redirecciones post-gestión

---

## FASE 5: Webhooks de Stripe

### 5.1 Sistema de Webhooks Stripe

#### ☐ Crear endpoint webhooks Stripe
- ☐ `app/api/webhooks/stripe/route.ts`
- ☐ Validación de firmas webhook
- ☐ Procesamiento de eventos críticos

#### ☐ Eventos a procesar
```typescript
const criticalEvents = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated'
]
```

#### ☐ Sincronización bidireccional
- ☐ Stripe → Base de datos [DB1]
- ☐ Logging de cambios en UserActivityLog
- ☐ Actualización de UserSubscription en tiempo real

---

## FASE 6: Interface de Usuario

### 6.1 Componentes de Suscripción

#### ☐ Crear componentes React
- ☐ `components/stripe/PricingCard.tsx`
- ☐ `components/stripe/SubscriptionStatus.tsx`
- ☐ `components/stripe/BillingPortalButton.tsx`
- ☐ `components/stripe/PaymentForm.tsx`

#### ☐ Integrar en Dashboard
- ☐ Añadir sección "Suscripción" en `/web-dashboard`
- ☐ Mostrar estado actual de suscripción
- ☐ Botones para upgrade/downgrade/cancelar
- ☐ Acceso directo al Portal de Stripe

#### ☐ Página de precios pública
- ☐ `/pricing` - página de planes disponibles
- ☐ Integración con Stripe Checkout
- ☐ Preview de impuestos según ubicación

---

## FASE 7: Control de Acceso por Suscripción

### 7.1 Middleware de Contenido

#### ☐ Implementar lógica de acceso
```typescript
// Niveles de acceso:
// OPEN: Sin login (visible para Google)
// FREE: Usuario registrado sin suscripción
// PREMIUM: Usuario con suscripción activa
```

#### ☐ Protección de rutas y contenido
- ☐ Hook `useSubscription()` para verificar estado
- ☐ Componente `<SubscriptionGate>` para contenido protegido
- ☐ Integración con base de datos [DB2] (contenido)

---

## FASE 8: Testing y Configuración de Producción

### 8.1 Testing Integral

#### ☐ Tests de funcionalidad
- ☐ Flujo completo de suscripción
- ☐ Cambios de plan
- ☐ Cancelaciones
- ☐ Webhooks de Stripe
- ☐ Detección fiscal automática

#### ☐ Tests específicos España
- ☐ Dirección continental → IVA 21%
- ☐ Dirección Canarias → IGIC 7%
- ☐ Validación códigos postales
- ☐ Portal de facturación en español

### 8.2 Configuración Producción

#### ☐ Configurar webhooks en producción
- ☐ URL: `https://tudominio.com/api/webhooks/stripe`
- ☐ Eventos críticos habilitados
- ☐ Validación de firmas activa

#### ☐ Migrar datos de test a producción
- ☐ Exportar productos y precios desde test
- ☐ Configurar productos en Stripe Live
- ☐ Actualizar UserBillingPlan con IDs de producción

---

## FASE 9: Monitorización y Compliance

### 9.1 Logging y Auditoría

#### ☐ Registros de actividad financiera
- ☐ Todos los pagos en UserActivityLog
- ☐ Cambios de suscripción
- ☐ Errores de facturación
- ☐ Eventos fiscales (cambio IVA/IGIC)

#### ☐ Compliance fiscal español
- ☐ Registro de aplicación correcta de impuestos
- ☐ Logs de detección automática Canarias/Continental
- ☐ Archivos de auditoría para Hacienda

### 9.2 Monitorización Operativa

#### ☐ Alertas automáticas
- ☐ Fallos de webhook
- ☐ Pagos fallidos
- ☐ Detección incorrecta de impuestos
- ☐ Errores de sincronización BD

---

## Comandos de Desarrollo

### Durante implementación
```bash
# Desarrollo con hot reload
pnpm dev

# Generar cliente Prisma tras cambios
pnpm db:generate

# Push cambios a BD de desarrollo
pnpm db:push

# Tunnel seguro para webhooks
ngrok http 3000

# Testing de webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Testing fiscal específico
```bash
# Crear customer test España Continental
stripe customers create --email="test-continental@example.com" --address[country]="ES" --address[postal_code]="28001"

# Crear customer test Canarias
stripe customers create --email="test-canarias@example.com" --address[country]="ES" --address[postal_code]="35001"
```

---

## Archivos Clave a Crear/Modificar

### Nuevos archivos necesarios:
```
lib/stripe/
├── client.ts                 # Cliente Stripe servidor
├── config.ts                 # Configuración centralizada
└── types.ts                  # Tipos TypeScript

lib/services/
├── stripeService.ts          # Operaciones Stripe
├── billingService.ts         # Lógica facturación
└── taxService.ts            # Fiscalidad española

app/api/stripe/
├── create-subscription/route.ts
├── cancel-subscription/route.ts
└── create-portal-session/route.ts

app/api/webhooks/stripe/route.ts

components/stripe/
├── PricingCard.tsx
├── SubscriptionStatus.tsx
└── BillingPortalButton.tsx

app/(pages-dashboard)/web-dashboard/billing/
└── page.tsx                  # Página gestión suscripciones
```

### Archivos a modificar:
```
.env                         # Variables Stripe
package.json                 # Dependencias
middleware.ts               # Protección rutas premium
```

---

## Notas Importantes

### Seguridad
- ✅ Nunca exponer claves secretas en frontend
- ✅ Validar todas las firmas de webhook
- ✅ Sanitizar inputs de usuario
- ✅ Rate limiting en endpoints críticos

### Fiscalidad España
- ✅ IVA Continental: 21% via Stripe Tax (automático)
- ✅ IGIC Canarias: 7% via Tax Rates (manual)
- ✅ Códigos postales Canarias: 35xxx, 38xxx
- ✅ Compliance con normativa española

### Base de Datos
- ✅ Sincronización bidireccional Stripe ↔ BD[DB1]
- ✅ Logs completos en UserActivityLog
- ✅ Backup automático datos facturación
- ✅ GDPR compliance en eliminaciones

---

**Estado**: ✅ Plan completado - Listo para implementación por fases

**Próximo paso**: Comenzar con FASE 1 - Configuración Inicial de Stripe