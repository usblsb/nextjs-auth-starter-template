# Configuración de Webhooks de Stripe

## 🌐 URL del Webhook Activo

**Webhook URL**: `https://b70595b2a97e.ngrok-free.app/api/webhooks/stripe`

> ⚠️ **IMPORTANTE**: Esta URL cambia cada vez que se reinicia ngrok. Para obtener la URL actual:
> ```bash
> curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url'
> ```

## 📋 Pasos para Configurar en Stripe Dashboard

### 1. **Acceder al Dashboard de Stripe**
- Ir a: https://dashboard.stripe.com/test/webhooks
- Hacer clic en "Add endpoint"

### 2. **Configurar el Endpoint**
- **Endpoint URL**: `https://b70595b2a97e.ngrok-free.app/api/webhooks/stripe`
- **Description**: "Next.js App - Billing Webhooks"
- **Events to send**: Seleccionar los siguientes eventos críticos:

#### ✅ **Eventos de Suscripciones**
- `customer.subscription.created` - Nueva suscripción
- `customer.subscription.updated` - Cambios en suscripción  
- `customer.subscription.deleted` - Suscripción cancelada

#### ✅ **Eventos de Pagos**
- `invoice.payment_succeeded` - Pago exitoso
- `invoice.payment_failed` - Pago fallido

#### ✅ **Eventos de Customers**
- `customer.created` - Nuevo customer
- `customer.updated` - Customer actualizado
- `customer.deleted` - Customer eliminado

### 3. **Obtener el Signing Secret**
Después de crear el webhook:

1. Hacer clic en el webhook recién creado
2. En la sección "Signing secret", hacer clic en "Reveal"
3. Copiar el secret que empieza con `whsec_...`
4. Actualizar el archivo `.env`:

```bash
# Actualizar esta línea en .env
STRIPE_WEBHOOK_SECRET="whsec_TU_SECRET_AQUI"
```

## 🧪 Testing de Webhooks

### Opción 1: Stripe CLI (Recomendado)
```bash
# Instalar Stripe CLI si no está instalado
# https://stripe.com/docs/stripe-cli

# Hacer login
stripe login

# Escuchar webhooks y reenviarlos a tu app local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# En otra terminal, trigger eventos de prueba
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.updated
```

### Opción 2: Testing Manual desde Dashboard
1. Ir a Stripe Dashboard → Webhooks → [Tu webhook]
2. Hacer clic en "Send test webhook"
3. Seleccionar evento de prueba
4. Verificar en los logs de tu app que se recibe correctamente

### Opción 3: Script de Testing Local
```bash
# Ejecutar nuestro script de testing
node test-stripe-webhooks.js
```

## 📊 Monitoreo de Webhooks

### Logs en la Aplicación
Los webhooks se registran automáticamente en:
- **Prisma Studio**: http://localhost:5555 → `user_activity_log`
- **Consola de Next.js**: Logs detallados en desarrollo

### Dashboard de Stripe
- Ir a: https://dashboard.stripe.com/test/webhooks/[webhook_id]
- Ver intentos de entrega y respuestas
- Retry de eventos fallidos

### Ngrok Web Interface
- Ir a: http://localhost:4040
- Ver requests HTTP en tiempo real
- Inspeccionar payloads y respuestas

## 🔧 Variables de Entorno Requeridas

Asegúrate de que estas variables estén configuradas en `.env`:

```bash
# Stripe API Keys
STRIPE_API_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Webhook Secret (obtener después de crear webhook)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Opcional para producción
NEXT_PUBLIC_APP_URL="https://tudominio.com"
```

## 🚨 Troubleshooting

### Error: "Invalid signature"
- ✅ Verificar que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- ✅ Verificar que la URL del webhook sea exacta (sin trailing slash)
- ✅ En desarrollo, la validación está desactivada

### Error: "No such customer"
- ✅ Normal en testing con datos falsos
- ✅ Usar Stripe CLI para eventos reales
- ✅ Verificar que customer metadata incluya `clerk_user_id`

### Error: "User profile not found"
- ✅ Asegurarse que el usuario existe en BD
- ✅ Verificar sincronización Clerk → BD
- ✅ Comprobar que `clerk_user_id` en metadata coincida

### Webhook no recibido
- ✅ Verificar que ngrok esté corriendo
- ✅ Comprobar URL pública: `curl -s http://127.0.0.1:4040/api/tunnels`
- ✅ Verificar que Next.js esté corriendo en puerto 3000
- ✅ Comprobar configuración en Stripe Dashboard

## 📝 Comando Rápido

Para obtener la configuración actual:

```bash
echo "Webhook URL: $(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')/api/webhooks/stripe"
```

---

**Estado**: ✅ Webhook endpoint implementado y listo para configurar en Stripe Dashboard