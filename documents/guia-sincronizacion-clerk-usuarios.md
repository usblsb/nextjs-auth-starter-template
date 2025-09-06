# Guía de Sincronización de Datos de Clerk y Registro de Actividad

## 📋 Resumen del Proyecto

Esta guía detalla los pasos necesarios para:

1. **Sincronizar datos de usuarios** registrados en Clerk con nuestra base de datos local
2. **Registrar actividad de usuarios** (login/logout) en la tabla de logs
3. **Mantener compliance GDPR** con retención de 10 años

---

## 🎯 Fase 1: Configuración de Webhooks de Clerk

### Objetivos

- Configurar webhooks en Clerk Dashboard
- Crear endpoints para recibir eventos de usuario
- Implementar validación de seguridad

### ✅ Checklist Fase 1

- [ ] **1.1** Acceder al Clerk Dashboard
- [ ] **1.2** Navegar a "Webhooks" en la configuración
- [ ] **1.3** Crear nuevo webhook endpoint: https://play.svix.com/in/e_y4kk85rGX5C5dFK9nZtVuOdgEXa/
- [ ] **1.4** Configurar URL del webhook: `https://tu-dominio.com/api/webhooks/clerk`
- [ ] **1.5** Seleccionar eventos a escuchar:
  - [ ] `user.created` - Usuario registrado
  - [ ] `user.updated` - Usuario actualizado
  - [ ] `user.deleted` - Usuario eliminado
  - [ ] `session.created` - Login de usuario
  - [ ] `session.ended` - Logout de usuario
- [ ] **1.6** Copiar el "Signing Secret" del webhook
- [ ] **1.7** Añadir `CLERK_WEBHOOK_SECRET` al archivo `.env`
- [ ] **1.8** Activar el webhook

---

## 🔧 Fase 2: Implementación de Endpoints API

### Objetivos

- Crear endpoint para recibir webhooks de Clerk
- Implementar validación de firma
- Procesar eventos de usuario y sesión

### ✅ Checklist Fase 2

- [ ] **2.1** Crear archivo `app/api/webhooks/clerk/route.ts`
- [ ] **2.2** Implementar validación de firma del webhook
- [ ] **2.3** Crear función para procesar evento `user.created`
- [ ] **2.4** Crear función para procesar evento `user.updated`
- [ ] **2.5** Crear función para procesar evento `user.deleted`
- [ ] **2.6** Crear función para procesar evento `session.created` (login)
- [ ] **2.7** Crear función para procesar evento `session.ended` (logout)
- [ ] **2.8** Implementar manejo de errores y logging
- [ ] **2.9** Añadir rate limiting para seguridad
- [ ] **2.10** Testear endpoint con herramientas como Postman

---

## 💾 Fase 3: Servicios de Sincronización de Datos

### Objetivos

- Crear servicios para sincronizar datos de usuario
- Implementar lógica de creación/actualización
- Manejar compliance GDPR automáticamente

### ✅ Checklist Fase 3

- [ ] **3.1** Crear directorio `lib/services/`
- [ ] **3.2** Crear `lib/services/userSyncService.ts`
- [ ] **3.3** Implementar función `createUserProfile()`:
  - [ ] Extraer datos del evento de Clerk
  - [ ] Mapear campos a modelo UserProfile
  - [ ] Establecer fecha de retención GDPR (10 años)
  - [ ] Registrar IP de registro
  - [ ] Guardar en base de datos
- [ ] **3.4** Implementar función `updateUserProfile()`:
  - [ ] Actualizar campos modificados
  - [ ] Mantener auditoría de cambios
  - [ ] Actualizar `syncedAt`
- [ ] **3.5** Implementar función `handleUserDeletion()`:
  - [ ] Marcar `deletionRequested = true`
  - [ ] Establecer `deletionRequestedAt`
  - [ ] Mantener datos para compliance legal
- [ ] **3.6** Crear función `syncExistingUsers()` para migración inicial
- [ ] **3.7** Implementar validación de datos
- [ ] **3.8** Añadir logging detallado

---

## 📊 Fase 4: Sistema de Registro de Actividad

### Objetivos

- Registrar todos los login/logout de usuarios
- Capturar metadatos de sesión
- Mantener trazabilidad completa

### ✅ Checklist Fase 4

- [ ] **4.1** Crear `lib/services/activityLogService.ts`
- [ ] **4.2** Implementar función `logUserLogin()`:
  - [ ] Capturar `clerkUserId` del evento
  - [ ] Registrar IP de acceso
  - [ ] Guardar User Agent
  - [ ] Establecer `action = 'LOGIN'`
  - [ ] Capturar metadatos de sesión
- [ ] **4.3** Implementar función `logUserLogout()`:
  - [ ] Registrar fin de sesión
  - [ ] Calcular duración de sesión
  - [ ] Establecer `action = 'LOGOUT'`
- [ ] **4.4** Crear función `logUserActivity()` genérica
- [ ] **4.5** Implementar captura de geolocalización (opcional)
- [ ] **4.6** Añadir detección de dispositivo
- [ ] **4.7** Crear índices para consultas de actividad
- [ ] **4.8** Implementar limpieza automática de logs antiguos

---

## 🔄 Fase 5: Sincronización Inicial

### Objetivos

- Migrar usuarios existentes de Clerk
- Poblar tabla UserProfile con datos actuales
- Verificar integridad de datos

### ✅ Checklist Fase 5

- [ ] **5.1** Crear script `scripts/syncClerkUsers.ts`
- [ ] **5.2** Configurar cliente de Clerk API
- [ ] **5.3** Implementar paginación para obtener todos los usuarios
- [ ] **5.4** Crear función `fetchAllClerkUsers()`
- [ ] **5.5** Implementar `migrateUserToProfile()` para cada usuario
- [ ] **5.6** Añadir barra de progreso para el proceso
- [ ] **5.7** Implementar manejo de errores y reintentos
- [ ] **5.8** Crear reporte de migración
- [ ] **5.9** Verificar datos migrados
- [ ] **5.10** Ejecutar script de migración

---

## 🛡️ Fase 6: Middleware y Seguridad

### Objetivos

- Implementar middleware de autenticación
- Capturar actividad automáticamente
- Asegurar endpoints

### ✅ Checklist Fase 6

- [ ] **6.1** Crear `middleware/activityLogger.ts`
- [ ] **6.2** Implementar captura automática de login en middleware
- [ ] **6.3** Crear hook `useActivityLogger` para cliente
- [ ] **6.4** Implementar rate limiting en webhooks
- [ ] **6.5** Añadir validación de IP whitelist (opcional)
- [ ] **6.6** Crear sistema de alertas para actividad sospechosa
- [ ] **6.7** Implementar encriptación de datos sensibles
- [ ] **6.8** Configurar CORS para webhooks
- [ ] **6.9** Añadir headers de seguridad
- [ ] **6.10** Testear seguridad con herramientas de pentesting

---

## 📈 Fase 7: Dashboard y Monitoreo

### Objetivos

- Crear dashboard para visualizar datos
- Implementar métricas de sincronización
- Monitorear salud del sistema

### ✅ Checklist Fase 7

- [ ] **7.1** Crear página `app/(pages-dashboard)/admin/users/page.tsx`
- [ ] **7.2** Implementar tabla de usuarios sincronizados
- [ ] **7.3** Crear filtros por fecha de registro
- [ ] **7.4** Añadir búsqueda por email/nombre
- [ ] **7.5** Implementar vista de actividad por usuario
- [ ] **7.6** Crear gráficos de actividad diaria/semanal
- [ ] **7.7** Añadir métricas de sincronización
- [ ] **7.8** Implementar alertas de fallos de webhook
- [ ] **7.9** Crear exportación de datos GDPR
- [ ] **7.10** Añadir logs de sistema en tiempo real

---

## 🧪 Fase 8: Testing y Validación

### Objetivos

- Testear todos los flujos de sincronización
- Validar compliance GDPR
- Verificar rendimiento

### ✅ Checklist Fase 8

- [ ] **8.1** Crear tests unitarios para `userSyncService`
- [ ] **8.2** Crear tests unitarios para `activityLogService`
- [ ] **8.3** Testear webhook endpoint con datos reales
- [ ] **8.4** Validar creación de usuario desde Clerk
- [ ] **8.5** Testear actualización de perfil
- [ ] **8.6** Verificar registro de login/logout
- [ ] **8.7** Testear eliminación de usuario
- [ ] **8.8** Validar campos GDPR automáticos
- [ ] **8.9** Testear rendimiento con volumen alto
- [ ] **8.10** Verificar integridad de datos
- [ ] **8.11** Testear recuperación ante fallos
- [ ] **8.12** Validar seguridad de webhooks

---

## 🚀 Fase 9: Deployment y Producción

### Objetivos

- Desplegar sistema en producción
- Configurar monitoreo
- Documentar procesos

### ✅ Checklist Fase 9

- [ ] **9.1** Configurar variables de entorno en producción
- [ ] **9.2** Actualizar webhook URL en Clerk Dashboard
- [ ] **9.3** Ejecutar migración de base de datos
- [ ] **9.4** Ejecutar sincronización inicial de usuarios
- [ ] **9.5** Configurar logging en producción
- [ ] **9.6** Implementar monitoreo de salud
- [ ] **9.7** Configurar alertas de sistema
- [ ] **9.8** Crear backup automático de datos
- [ ] **9.9** Documentar procedimientos de mantenimiento
- [ ] **9.10** Entrenar equipo en nuevos procesos
- [ ] **9.11** Crear plan de rollback
- [ ] **9.12** Monitorear sistema 48h post-deployment

---

## 📚 Recursos y Referencias

### Documentación Técnica

- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks)
- [Clerk API Reference](https://clerk.com/docs/reference)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes)

### Archivos del Proyecto

- `prisma/schema.prisma` - Modelo UserProfile y UserActivityLog
- `app/api/webhooks/clerk/route.ts` - Endpoint de webhooks
- `lib/services/userSyncService.ts` - Servicio de sincronización
- `lib/services/activityLogService.ts` - Servicio de logs

### Variables de Entorno Requeridas

```env
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
```

---

## ⚠️ Consideraciones Importantes

### Compliance GDPR

- ✅ Retención automática de 10 años configurada
- ✅ Campos de consentimiento implementados
- ✅ Proceso de eliminación bajo demanda
- ✅ Auditoría completa de cambios

### Seguridad

- 🔒 Validación de firma de webhooks obligatoria
- 🔒 Rate limiting implementado
- 🔒 Encriptación de datos sensibles
- 🔒 Logs de seguridad activados

### Rendimiento

- ⚡ Índices optimizados para consultas frecuentes
- ⚡ Paginación en consultas grandes
- ⚡ Cache de datos frecuentemente accedidos
- ⚡ Limpieza automática de logs antiguos

---

**Fecha de creación**: $(date +"%Y-%m-%d")
**Versión**: 1.0
**Estado**: En desarrollo

> 💡 **Tip**: Marca cada checkbox ✅ conforme completes las tareas. Esto te ayudará a mantener el progreso y asegurar que no se omita ningún paso crítico.
