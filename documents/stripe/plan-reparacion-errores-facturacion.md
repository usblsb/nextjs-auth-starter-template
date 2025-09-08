# Plan de Reparación de Errores - Sistema de Facturación Stripe

Para implementar Stripe con gestión fiscal inteligente para España y Canarias,
tengo ya configurado Stripe Tax y tu debes de personalizar lógica para
diferenciar clientes de la península (IVA 21%) y de Canarias (IGIC 7%) durante
el checkout. Stripe maneja el IVA a nivel nacional, pero requiere ajustes
propios para IGIC, ya que las Islas Canarias quedan fuera del sistema estándar
de IVA en Stripe Tax.
Ya esta activado Stripe Tax y registro fiscal.

Debes usar el formulario de Stripe Payment Element + Address Element
(integración avanzada), configurando la recogida de dirección como “requerida”
para facturación y/o envío, activando la opción automática para impuestos. Esto te permite obtener la dirección completa
y facilita la conmutación fiscal entre península e islas Canarias.
Integración directa con APIs de Stripe (PaymentIntent), permitiendo flujos más complejos y acceso a más de 40 métodos de pago, así como integración con Address Element y Tax ID Element.

## Resumen de Problemas Identificados

**Contexto**: Flujo de suscripción Premium con errores en cálculo de impuestos, fechas inválidas y falta de checkout de pago.

**Errores identificados**:

1. ❌ Tipo impositivo muestra "NaN%"
2. ❌ IVA muestra "NaN EUR"
3. ❌ Total muestra "NaN EUR"
4. ❌ No se solicita información de tarjeta de pago
5. ❌ Estado suscripción muestra "Sin suscripción activa"
6. ❌ Nivel actual no se muestra
7. ❌ Error BD: fechas inválidas (`currentPeriodStart/End`)
8. ❌ Error BD: serialización BigInt

---

## FASE 1: Reparación del Cálculo de Impuestos

### 1.1 Diagnóstico del Sistema Fiscal

- [ ] Revisar función `determineTaxConfiguration()` en `lib/services/taxService.ts`
- [ ] Verificar detección correcta código postal Madrid (28004)
- [ ] Validar que devuelve `taxConfig.rate` numérico válido
- [ ] Comprobar configuración `stripeConfig.tax.spain.vatRate`

### 1.2 Corrección Frontend - Modal de Dirección

- [ ] Localizar componente de modal de facturación
- [ ] Verificar cálculo de `taxInfo.taxConfig.rate`
- [ ] Corregir display de porcentaje (debe mostrar `21%` no `NaN%`)
- [ ] Validar que `taxInfo` se pasa correctamente entre componentes

### 1.3 Corrección Frontend - Modal de Confirmación

- [ ] Revisar cálculo de precio base (`29.00 EUR`)
- [ ] Verificar cálculo de impuestos (`basePrice * taxRate`)
- [ ] Corregir cálculo de total (`basePrice + taxAmount`)
- [ ] Asegurar formato de moneda correcto

---

## FASE 2: Integración de Stripe Checkout

### 2.1 Implementar Flujo de Pago Completo

- [ ] Revisar API `app/api/stripe/create-subscription/route.ts`
- [ ] Verificar si crea `PaymentIntent` o usa `Stripe Checkout`
- [ ] Implementar redirección a Stripe Checkout para recolección de tarjeta
- [ ] Configurar URLs de éxito/cancelación

### 2.2 Modificar Flujo de Confirmación

- [ ] Cambiar modal "Procesando..." por redirección a Stripe
- [ ] Implementar manejo de retorno desde Stripe Checkout
- [ ] Configurar webhook para confirmación de pago
- [ ] Validar estado `incomplete` vs `active`

---

## FASE 3: Corrección de Fechas y Sincronización BD

### 3.1 Reparar Fechas Inválidas

- [ ] Revisar `lib/services/billingService.ts` línea 205
- [ ] Verificar conversión de timestamps Unix a Date
- [ ] Corregir `currentPeriodStart` y `currentPeriodEnd`
- [ ] Validar campos de fecha de Stripe antes de crear Date()

### 3.2 Corrección Error BigInt

- [ ] Localizar error en `app/api/user/billing-address/route.ts` línea 88
- [ ] Identificar campo BigInt en respuesta (probablemente `addressId`)
- [ ] Convertir BigInt a string antes de JSON.stringify()
- [ ] Implementar serialización personalizada si es necesario

---

## FASE 4: Corrección Estado de Suscripción

### 4.1 Sincronización Status Suscripción

- [ ] Revisar API `app/api/stripe/subscription-status/route.ts`
- [ ] Verificar consulta a BD para obtener suscripción activa
- [ ] Corregir lógica de determinación de estado
- [ ] Validar sincronización entre Stripe y BD local

### 4.2 Display de Nivel de Acceso

- [ ] Revisar componente de dashboard que muestra estado
- [ ] Verificar mapping de features a nivel de acceso
- [ ] Corregir display de "Nivel actual" (FREE/PREMIUM)
- [ ] Asegurar actualización en tiempo real tras suscripción

---

## FASE 5: Validación y Testing

### 5.1 Testing de Flujo Completo

- [ ] Probar dirección Madrid (código postal 28004) → IVA 21%
- [ ] Probar dirección Canarias (código postal 35001) → IGIC 7%
- [ ] Verificar cálculos matemáticos correctos
- [ ] Validar redirección a Stripe Checkout
- [ ] Confirmar actualización estado tras pago exitoso

### 5.2 Testing de Casos Edge

- [ ] Probar con códigos postales inválidos
- [ ] Verificar comportamiento con países no-EU
- [ ] Testear cancelación en Stripe Checkout
- [ ] Validar manejo de errores de pago

---

## FASE 6: Logs y Monitorización

### 6.1 Mejora de Logging

- [ ] Añadir logs detallados en cálculo de impuestos
- [ ] Registrar errores de conversión de fechas
- [ ] Logear problemas de sincronización BD
- [ ] Implementar alertas para errores críticos

### 6.2 Validación de Datos

- [ ] Implementar validación de fechas antes de BD
- [ ] Añadir checks de tipos numéricos para impuestos
- [ ] Validar estructura de respuestas de Stripe
- [ ] Sanitizar datos antes de serialización JSON

---

## Archivos Principales a Revisar/Modificar

### Backend APIs

```
app/api/stripe/create-subscription/route.ts    # Flujo de suscripción
app/api/stripe/subscription-status/route.ts    # Estado suscripción
app/api/user/billing-address/route.ts          # Error BigInt
```

### Servicios

```
lib/services/taxService.ts                     # Cálculo impuestos
lib/services/billingService.ts                 # Fechas inválidas
lib/services/stripeService.ts                  # Integración Stripe
```

### Frontend Components

```
components/stripe/BillingAddressModal.tsx      # Modal dirección
components/stripe/ConfirmationModal.tsx        # Modal confirmación
components/dashboard/SubscriptionStatus.tsx    # Estado dashboard
```

---

## Comandos de Desarrollo Útiles

### Debugging

```bash
# Verificar tipos y compilación
npx tsc --noEmit

# Logs en tiempo real
pnpm dev | grep -E "(❌|⚠️|Error)"

# Testing manual con curl
curl -X POST localhost:3000/api/stripe/subscription-status \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_test"}'
```

### Stripe CLI para Testing

```bash
# Escuchar eventos de webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Crear customer de test España
stripe customers create --email="test@test.com" --address[country]="ES" --address[postal_code]="28004"
```

---

## Criterios de Éxito

### ✅ Funcionamiento Esperado Final

1. **Impuestos**: IVA 21% calculado y mostrado correctamente
2. **Totales**: Precio base + IVA = Total correcto en EUR
3. **Checkout**: Redirección a Stripe para pago con tarjeta
4. **Estado**: "Premium Activo" tras pago exitoso
5. **Nivel**: "PREMIUM" visible en dashboard
6. **BD**: Sin errores de fechas ni BigInt
7. **Logs**: Sincronización exitosa Stripe ↔ BD

### 🎯 Métricas de Validación

- [ ] Cálculo matemático: 29.00 + (29.00 × 0.21) = 35.09 EUR
- [ ] Sin errores "NaN" en frontend
- [ ] Sin errores Date/BigInt en logs
- [ ] Status 200 en todas las APIs
- [ ] Suscripción `active` en BD tras pago

---

**Estado**: 📋 Plan completo - Listo para implementación secuencial por fases

**Próximo paso**: Comenzar con FASE 1 - Diagnóstico del cálculo de impuestos
