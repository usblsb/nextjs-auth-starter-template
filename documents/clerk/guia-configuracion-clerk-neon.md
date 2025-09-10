# Guía de Configuración Clerk + Neon - Sistema de Logging de Actividad

Esta guía documenta la configuración completa del sistema de logging de actividad de usuarios usando Clerk (autenticación) y Neon (base de datos PostgreSQL).

## 📋 Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Configuración Inicial](#configuración-inicial)
3. [Configuración de Webhooks](#configuración-de-webhooks)
4. [Estructura de Base de Datos](#estructura-de-base-de-datos)
5. [Eventos Soportados](#eventos-soportados)
6. [Solución de Problemas](#solución-de-problemas)
7. [Agregar Nuevos Eventos](#agregar-nuevos-eventos)
8. [Despliegue a Producción](#despliegue-a-producción)

## 🎯 Resumen del Sistema

### ¿Qué hace este sistema?

- **Registra automáticamente** todos los login/logout de usuarios
- **Almacena metadatos** como IP, user agent, timestamps
- **Proporciona auditoría completa** de actividad de usuarios
- **Funciona en tiempo real** mediante webhooks de Clerk

### Arquitectura del Sistema

```
[Usuario] → [Clerk Auth] → [Webhook] → [Next.js API] → [Neon DB]
                            ↓
                    [user_activity_log]
```

## ⚙️ Configuración Inicial

### 1. Variables de Entorno (.env)

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_OUT_URL=/sign-out

# Clerk Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/web-dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/web-dashboard
NEXT_PUBLIC_CLERK_SIGN_OUT_FALLBACK_REDIRECT_URL=/

# Neon Database
DB1_DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 2. Estructura del Proyecto

```
/app
  /api
    /webhooks
      /clerk
        route.ts          # Endpoint principal de webhooks
  /components
    /layouts
      header.tsx          # Botón de logout corregido
/lib
  /services
    userSyncService.ts    # Sincronización de usuarios
    activityLogService.ts # Logging de actividad (opcional)
/prisma
  schema.prisma          # Esquema de base de datos
```

## 🎣 Configuración de Webhooks

### 1. En Clerk Dashboard

1. **Acceder a**: https://dashboard.clerk.com
2. **Seleccionar tu aplicación**
3. **Ir a**: Webhooks (menú lateral)
4. **Crear/Editar webhook** con:

   ```
   URL: https://tu-dominio.com/api/webhooks/clerk

   Eventos suscritos:
   ✅ session.created     (login)
   ✅ session.removed     (logout)
   ✅ user.created        (registro)
   ✅ user.updated        (perfil)
   ✅ user.deleted        (eliminación)
   ✅ email.created       (opcional)
   ✅ role.created        (opcional)
   ✅ role.updated        (opcional)
   ✅ role.deleted        (opcional)

   Secret: whsec_... (copiar a .env)
   ```

### 2. Para Desarrollo Local con ngrok

```bash
# Instalar ngrok
brew install ngrok

# Configurar token (obtener de ngrok.com)
ngrok config add-authtoken tu_token_aqui

# Exponer aplicación local
ngrok http 3002

# Usar URL en Clerk Dashboard
# Ejemplo: https://abc123.ngrok-free.app/api/webhooks/clerk
```

### 3. Verificar Configuración

```bash
# Test webhook local
curl -X GET "http://localhost:3002/api/webhooks/clerk"
# Respuesta esperada: {"error":"Método no permitido"}

# Test con ngrok
curl -X GET "https://tu-url.ngrok-free.app/api/webhooks/clerk"
# Respuesta esperada: {"error":"Método no permitido"}
```

## 🗄️ Estructura de Base de Datos

### Tabla Principal: user_activity_log

```sql
CREATE TABLE user_activity_log (
  id BIGSERIAL PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  clerkUserId VARCHAR(50),
  clerkSessionId VARCHAR(100),
  action VARCHAR(120) NOT NULL,
  description TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  metadata JSONB,
  sessionId VARCHAR(100),
  resourceId VARCHAR(100),
  resourceType VARCHAR(50),
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_activity_clerk_user_id ON user_activity_log(clerkUserId);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(createdAt);
CREATE INDEX idx_user_activity_action ON user_activity_log(action);
```

### Campos Importantes

- **userId/clerkUserId**: ID del usuario de Clerk
- **clerkSessionId**: ID único de la sesión
- **action**: LOGIN, LOGOUT, etc.
- **ipAddress**: IP del cliente
- **userAgent**: Navegador del cliente
- **metadata**: Datos adicionales en JSON
- **createdAt**: Timestamp del evento

## 📡 Eventos Soportados

### 1. Login - `session.created`

**Cuándo se dispara**: Usuario inicia sesión

```json
{
	"type": "session.created",
	"data": {
		"id": "sess_...",
		"user_id": "user_...",
		"status": "active",
		"created_at": 1234567890
	}
}
```

**Acción**: Crea registro con `action: 'LOGIN'`

### 2. Logout - `session.removed`

**Cuándo se dispara**: Usuario cierra sesión

```json
{
	"type": "session.removed",
	"data": {
		"id": "sess_...",
		"user_id": "user_...",
		"status": "removed",
		"updated_at": 1234567890
	}
}
```

**Acción**: Crea registro con `action: 'LOGOUT'`

### 3. Usuario Creado - `user.created`

**Cuándo se dispara**: Nuevo usuario se registra
**Acción**: Crea perfil en `user_profiles` tabla

### 4. Usuario Actualizado - `user.updated`

**Cuándo se dispara**: Usuario actualiza perfil
**Acción**: Actualiza datos en `user_profiles`

### 5. Usuario Eliminado - `user.deleted`

**Cuándo se dispara**: Usuario elimina cuenta
**Acción**: Marca usuario para eliminación GDPR

## 🔧 Solución de Problemas

### Problema: Webhook no recibe eventos

**Síntomas**: No aparecen registros en `user_activity_log`

**Soluciones**:

1. Verificar URL del webhook en Clerk Dashboard
2. Comprobar que el servidor está corriendo
3. Revisar logs de la aplicación para errores
4. Verificar que los eventos están suscritos correctamente

```bash
# Verificar logs en desarrollo
# Buscar mensajes como:
📨 Webhook recibido: { type: 'session.created', ... }
✅ Login registrado exitosamente: user_...
```

### Problema: Eventos de login llegan, logout no

**Causa**: Clerk envía `session.removed` no `session.ended`

**Solución**: Verificar que el webhook maneja ambos eventos:

```typescript
case 'session.ended':
case 'session.removed':
  await processSessionEnded(event.data, clientIP);
  break;
```

### Problema: Timeouts en webhook

**Causa**: Código complejo en el webhook

**Solución**: Usar logging simple directo:

```typescript
await prisma.userActivityLog.create({
	data: {
		userId: data.user_id,
		clerkUserId: data.user_id,
		action: "LOGIN",
		// ... otros campos
	},
});
```

### Problema: Error de validación de firma

**Síntomas**: Error 401 "Firma inválida"

**Soluciones**:

1. Verificar `CLERK_WEBHOOK_SECRET` en .env
2. Copiar el secret exacto desde Clerk Dashboard
3. En desarrollo, la validación está desactivada

## ➕ Agregar Nuevos Eventos

### 1. Identificar el Evento

Consulta la [documentación de webhooks de Clerk](https://clerk.com/docs/integrations/webhooks/overview) para eventos disponibles.

### 2. Suscribirse al Evento

En Clerk Dashboard → Webhooks → Editar → Agregar evento

### 3. Agregar Handler en el Código

En `app/api/webhooks/clerk/route.ts`:

```typescript
// Agregar nueva función
async function processNuevoEvento(data: any, clientIP: string) {
	try {
		await prisma.userActivityLog.create({
			data: {
				userId: data.user_id,
				clerkUserId: data.user_id,
				action: "NUEVA_ACCION",
				description: `Descripción del nuevo evento`,
				ipAddress: clientIP,
				userAgent: "Clerk Webhook",
				metadata: {
					eventData: data,
					clerkEvent: "nombre.evento",
					timestamp: new Date().toISOString(),
				},
			},
		});

		console.log("✅ Nuevo evento registrado:", data.user_id);
	} catch (error) {
		console.error("❌ Error en nuevo evento:", error);
	}
}

// Agregar case en switch
switch (event.type) {
	// ... casos existentes
	case "nombre.evento":
		await processNuevoEvento(event.data, clientIP);
		break;
}
```

### 4. Probar el Nuevo Evento

```bash
# Test local del nuevo evento
curl -X POST "http://localhost:3002/api/webhooks/clerk" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Svix-Webhooks/1.0" \
  -d '{"type":"nombre.evento","data":{"user_id":"test"}}'
```

## 🚀 Despliegue a Producción

### 1. Variables de Entorno

Configurar en tu plataforma de hosting:

- `CLERK_WEBHOOK_SECRET` (secret de producción)
- `DATABASE_URL` (Neon production)
- Otras variables de Clerk

### 2. Actualizar Webhook URL

En Clerk Dashboard, cambiar:

- De: `https://abc123.ngrok-free.app/api/webhooks/clerk`
- A: `https://tu-dominio.com/api/webhooks/clerk`

### 3. Verificar Funcionamiento

```bash
# Test webhook en producción
curl -X GET "https://tu-dominio.com/api/webhooks/clerk"

# Verificar base de datos
SELECT COUNT(*) FROM user_activity_log WHERE createdAt > NOW() - INTERVAL '1 day';
```

### 4. Monitoreo

Configurar alertas para:

- Errores 500 en `/api/webhooks/clerk`
- Falta de eventos de login/logout por período prolongado
- Errores de conexión a base de datos

## 📊 Consultas Útiles

### Ver Actividad Reciente

```sql
SELECT
  "clerkUserId",
  action,
  description,
  "ipAddress",
  "createdAt"
FROM user_activity_log
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Estadísticas de Login por Día

```sql
SELECT
  DATE("createdAt") as fecha,
  COUNT(*) as total_logins
FROM user_activity_log
WHERE action = 'LOGIN'
  AND "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY fecha DESC;
```

### Usuarios Más Activos

```sql
SELECT
  "clerkUserId",
  COUNT(*) as total_eventos,
  MAX("createdAt") as ultimo_evento
FROM user_activity_log
GROUP BY "clerkUserId"
ORDER BY total_eventos DESC
LIMIT 10;
```

### Detectar Actividad Sospechosa

```sql
SELECT
  "clerkUserId",
  "ipAddress",
  COUNT(*) as logins_desde_ip,
  MIN("createdAt") as primer_login,
  MAX("createdAt") as ultimo_login
FROM user_activity_log
WHERE action = 'LOGIN'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "clerkUserId", "ipAddress"
HAVING COUNT(*) > 10
ORDER BY logins_desde_ip DESC;
```

## 🔄 Mantenimiento

### Limpieza de Logs Antiguos

```sql
-- Eliminar logs más antiguos de 6 meses
DELETE FROM user_activity_log
WHERE "createdAt" < NOW() - INTERVAL '6 months';

-- O crear job automático
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity_log
  WHERE "createdAt" < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar mensualmente
SELECT cron.schedule('cleanup-activity-logs', '0 0 1 * *', 'SELECT cleanup_old_activity_logs();');
```

### Backup de Logs

```bash
# Exportar logs por fecha
psql "$DATABASE_URL" -c "
COPY (
  SELECT * FROM user_activity_log
  WHERE \"createdAt\" BETWEEN '2024-01-01' AND '2024-12-31'
) TO STDOUT WITH CSV HEADER;" > activity_logs_2024.csv
```

---

## 📞 Soporte

Para dudas o problemas:

1. **Revisar logs** de la aplicación primero
2. **Verificar configuración** usando esta guía
3. **Probar webhooks localmente** con curl
4. **Consultar documentación** de [Clerk](https://clerk.com/docs) y [Neon](https://neon.tech/docs)

**Última actualización**: Septiembre 2025  
**Versión**: 1.0  
**Estado**: Funcional y probado
