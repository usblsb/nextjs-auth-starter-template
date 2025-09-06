# Fase 2: Configuración del Signing Secret

## 📋 Resumen

Este documento explica cómo obtener y configurar el **Signing Secret** del webhook desde el Clerk Dashboard para validar las firmas de los webhooks.

## 🔑 ¿Qué es el Signing Secret?

El Signing Secret es una clave secreta que Clerk usa para firmar los webhooks que envía. Esto permite verificar que los webhooks realmente provienen de Clerk y no han sido modificados.

## 📝 Pasos para Obtener el Signing Secret

### 1. Acceder al Clerk Dashboard
- Ve a [dashboard.clerk.com](https://dashboard.clerk.com)
- Inicia sesión con tu cuenta
- Selecciona tu aplicación

### 2. Navegar a Webhooks
- En el menú lateral, busca la sección **"Webhooks"**
- Haz clic en **"Webhooks"**

### 3. Seleccionar tu Webhook
- Busca el webhook que creaste en la Fase 1
- Debería tener la URL: `https://play.svix.com/in/e_y4kk85rGX5C5dFK9nZtVuOdgEXa/`
- Haz clic en el webhook para abrirlo

### 4. Copiar el Signing Secret
- En la página del webhook, busca la sección **"Signing Secret"**
- Haz clic en **"Reveal"** o **"Show"** para mostrar el secret
- Copia el valor completo (debería empezar con `whsec_`)

## 🔧 Configuración en el Proyecto

### Opción 1: Archivo .env Local (Recomendado para desarrollo)

1. Crea o edita el archivo `.env.local` en la raíz del proyecto:
```bash
# Webhook Secret from Clerk Dashboard
CLERK_WEBHOOK_SECRET=whsec_tu_signing_secret_aqui
```

### Opción 2: Variables de Entorno del Sistema

```bash
export CLERK_WEBHOOK_SECRET="whsec_tu_signing_secret_aqui"
```

### Opción 3: Vercel (Para producción)

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega:
   - **Name**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_tu_signing_secret_aqui`
   - **Environment**: Production, Preview, Development

## ✅ Verificación

### 1. Verificar que la Variable Esté Disponible

Puedes crear un archivo temporal para verificar:

```typescript
// test-env.js
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? '✅ Configurado' : '❌ No configurado');
```

Ejecuta:
```bash
node test-env.js
```

### 2. Verificar en el Endpoint

El endpoint ya incluye validación. Si el secret no está configurado, verás este error en los logs:
```
❌ CLERK_WEBHOOK_SECRET no está configurado
```

## 🔒 Seguridad

### ⚠️ Importante
- **NUNCA** commits el Signing Secret al repositorio
- **NUNCA** compartas el Signing Secret públicamente
- Usa diferentes secrets para desarrollo y producción
- Rota el secret periódicamente desde el Clerk Dashboard

### 📁 Archivos a Ignorar

Asegúrate de que tu `.gitignore` incluya:
```
.env.local
.env
*.env
```

## 🧪 Testing

### 1. Webhook de Prueba

Una vez configurado el secret, puedes probar el endpoint:

1. Ve a tu webhook en Clerk Dashboard
2. Busca la opción **"Send Test Event"** o **"Test"**
3. Envía un evento de prueba
4. Verifica los logs de tu aplicación

### 2. Logs Esperados

Con `DEBUG_MODE=true`, deberías ver:
```
📨 Webhook recibido: { type: 'user.created', timestamp: '2024-01-15T10:30:00.000Z' }
🆕 Usuario creado: { id: 'user_xxx', email: 'test@example.com', ... }
```

## 🚨 Troubleshooting

### Error: "CLERK_WEBHOOK_SECRET no está configurado"
- Verifica que la variable esté en tu archivo `.env.local`
- Reinicia el servidor de desarrollo: `pnpm dev`
- Verifica que no haya espacios extra en el valor

### Error: "Firma inválida"
- Verifica que el Signing Secret sea correcto
- Asegúrate de copiar el secret completo desde Clerk Dashboard
- Verifica que el webhook esté enviando los headers correctos

### Error: "Headers de webhook faltantes"
- Verifica que el webhook esté configurado correctamente en Clerk
- Asegúrate de que la URL del webhook sea correcta
- Verifica que Svix esté reenviando los headers correctamente

## 📚 Referencias

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## ✅ Checklist Final

- [ ] Signing Secret copiado desde Clerk Dashboard
- [ ] Variable `CLERK_WEBHOOK_SECRET` configurada en `.env.local`
- [ ] Servidor reiniciado después de configurar la variable
- [ ] Endpoint probado con webhook de prueba
- [ ] Logs verificados para confirmar validación exitosa
- [ ] Secret no commitido al repositorio

---

**Próximo paso**: Una vez completada esta configuración, el endpoint estará listo para recibir y validar webhooks de Clerk de forma segura.