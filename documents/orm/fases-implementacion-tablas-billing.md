# Fases de Implementación - Sistema de Facturación y Suscripciones

## Resumen del Proyecto

Implementación de un sistema completo de facturación integrado con Stripe y Clerk, utilizando Prisma ORM y PostgreSQL 17 en Neon.com. El esquema incluye 5 tablas principales con prefijo `user_` para gestionar planes, suscripciones, direcciones de facturación, logs de actividad y permisos de usuario.

---

## FASE 1: Preparación del Entorno

### 1.1 Verificación de Dependencias
- [ ] Confirmar que Prisma ORM está configurado correctamente
- [ ] Verificar conexión activa con Neon.com (PostgreSQL 17)
- [ ] Validar que las variables de entorno están configuradas
- [ ] Comprobar que el archivo `schema.prisma` base existe

### 1.2 Instalación de Dependencias Adicionales
- [ ] Verificar que `@prisma/client` está instalado
- [ ] Confirmar que `prisma` está en devDependencies
- [ ] Validar versiones compatibles con Next.js 15

### 1.3 Backup de Seguridad
- [ ] Crear backup del `schema.prisma` actual
- [ ] Documentar estado actual de la base de datos
- [ ] Crear punto de restauración en caso de errores

---

## FASE 2: Definición del Schema Prisma

### 2.1 Modelo UserBillingPlan (Catálogo de Planes)
- [ ] Crear modelo `UserBillingPlan` con campos básicos
- [ ] Definir `planKey` como clave primaria (String)
- [ ] Configurar `stripePriceId` como único
- [ ] Añadir campo `meta` tipo JSON para características
- [ ] Establecer relación con `UserSubscription`
- [ ] Configurar mapeo a tabla `user_billing_plans`

### 2.2 Modelo UserSubscription (Suscripciones)
- [ ] Crear modelo `UserSubscription` con ID BigInt autoincremental
- [ ] Definir campos de integración con Stripe (customer, subscription, price)
- [ ] Configurar campos de usuario (userId de Clerk)
- [ ] Añadir campos de estado y periodicidad (String sin ENUM)
- [ ] Definir campos de período (start/end dates)
- [ ] Configurar campo `features` como array de strings
- [ ] Añadir campo `raw` JSON para payload de Stripe
- [ ] Establecer relación con `UserBillingPlan`
- [ ] Configurar índices por `userId` y `stripePriceId`
- [ ] Mapear a tabla `user_subscriptions`

### 2.3 Modelo UserBillingAddress (Direcciones de Facturación)
- [ ] Crear modelo `UserBillingAddress` con ID BigInt
- [ ] Definir campos de dirección (país, estado, ciudad, código postal)
- [ ] Configurar campo `country` con restricción VARCHAR(2)
- [ ] Añadir campo `fullAddress` tipo Text
- [ ] Establecer relación con usuario via `userId`
- [ ] Configurar índice por `userId`
- [ ] Mapear a tabla `user_billing_address`

### 2.4 Modelo UserActivityLog (Logs de Actividad)
- [ ] Crear modelo `UserActivityLog` con ID BigInt
- [ ] Definir campos de auditoría (action, timestamp, IP, userAgent)
- [ ] Configurar campo `action` con VARCHAR(120)
- [ ] Añadir campo `metadata` JSON para contexto adicional
- [ ] Establecer relación con usuario via `userId`
- [ ] Configurar índice por `userId`
- [ ] Mapear a tabla `user_activity_log`

### 2.5 Modelo UserPermission (Permisos de Usuario)
- [ ] Crear modelo `UserPermission` con ID BigInt
- [ ] Definir campos de permisos (type, value)
- [ ] Configurar restricciones VARCHAR para campos de permiso
- [ ] Añadir campo `expiresAt` opcional
- [ ] Establecer relación con usuario via `userId`
- [ ] Configurar índice por `userId`
- [ ] Mapear a tabla `user_permissions`

---

## FASE 3: Generación y Aplicación de Migraciones

### 3.1 Migración Inicial de Tablas
- [ ] Ejecutar `pnpm prisma migrate dev --name init_billing`
- [ ] Verificar que todas las tablas se crean correctamente
- [ ] Confirmar que los índices se establecen apropiadamente
- [ ] Validar que las relaciones funcionan correctamente

### 3.2 Generación del Cliente Prisma
- [ ] Ejecutar `pnpm prisma generate`
- [ ] Verificar que el cliente se genera sin errores
- [ ] Confirmar que los tipos TypeScript están disponibles
- [ ] Validar que las relaciones están tipadas correctamente

### 3.3 Verificación de la Estructura
- [ ] Usar `pnpm prisma studio` para inspeccionar tablas
- [ ] Verificar que todas las tablas tienen prefijo `user_`
- [ ] Confirmar que los tipos de datos son correctos
- [ ] Validar que las restricciones están aplicadas

---

## FASE 4: Implementación de Restricciones SQL

### 4.1 Creación de Migración para Comentarios y Checks
- [ ] Ejecutar `pnpm prisma migrate dev --create-only --name comments_and_checks`
- [ ] Localizar el archivo de migración SQL generado
- [ ] Preparar el contenido SQL para comentarios y restricciones

### 4.2 Añadir Comentarios de Tablas
- [ ] Agregar comentarios descriptivos para cada tabla
- [ ] Documentar el propósito de `user_billing_plans`
- [ ] Explicar la función de `user_subscriptions`
- [ ] Describir `user_billing_address` para impuestos españoles
- [ ] Comentar `user_activity_log` para auditoría
- [ ] Documentar `user_permissions` para control de acceso

### 4.3 Añadir Comentarios de Columnas
- [ ] Comentar todas las columnas de `user_billing_plans`
- [ ] Documentar campos de `user_subscriptions` (especialmente Stripe)
- [ ] Explicar campos de `user_billing_address` (postal_code para IGIC/IVA)
- [ ] Comentar campos de `user_activity_log` (IP, userAgent, metadata)
- [ ] Describir campos de `user_permissions` (type, value, expires)

### 4.4 Implementar Restricciones CHECK
- [ ] Crear CHECK para `status` en `user_subscriptions`
- [ ] Definir valores válidos: trialing, active, past_due, canceled, etc.
- [ ] Crear CHECK para `billing_period` en `user_subscriptions`
- [ ] Permitir valores: monthly, annual (o NULL)
- [ ] Validar que las restricciones funcionan correctamente

### 4.5 Aplicar Migración SQL
- [ ] Ejecutar `pnpm prisma migrate deploy`
- [ ] Verificar que los comentarios se aplicaron correctamente
- [ ] Confirmar que las restricciones CHECK funcionan
- [ ] Probar inserción de datos inválidos (debe fallar)

---

## FASE 5: Validación y Pruebas

### 5.1 Verificación de Comentarios
- [ ] Ejecutar consulta SQL para ver comentarios de tablas
- [ ] Verificar comentarios de columnas con consulta SQL
- [ ] Confirmar que la documentación es clara y precisa

### 5.2 Pruebas de Restricciones CHECK
- [ ] Intentar insertar `status` inválido (debe fallar)
- [ ] Probar `billing_period` con valor no permitido (debe fallar)
- [ ] Verificar que valores válidos se insertan correctamente
- [ ] Confirmar que NULL es aceptado donde corresponde

### 5.3 Pruebas de Relaciones
- [ ] Crear registro en `user_billing_plans`
- [ ] Crear `user_subscription` referenciando el plan
- [ ] Verificar que la relación funciona correctamente
- [ ] Probar consultas con `include` para obtener datos relacionados

### 5.4 Pruebas de Índices
- [ ] Verificar que los índices por `userId` existen
- [ ] Confirmar índice por `stripePriceId` en subscriptions
- [ ] Probar rendimiento de consultas por usuario
- [ ] Validar que las consultas usan los índices apropiados

---

## FASE 6: Implementación de Código de Ejemplo

### 6.1 Configuración del Cliente Prisma
- [ ] Crear archivo `lib/prisma.ts` con configuración singleton
- [ ] Configurar cliente para desarrollo y producción
- [ ] Implementar manejo de conexiones apropiado

### 6.2 Operaciones CRUD Básicas
- [ ] Implementar creación de planes de facturación
- [ ] Crear funciones para gestionar suscripciones
- [ ] Desarrollar operaciones para direcciones de facturación
- [ ] Implementar logging de actividad de usuarios
- [ ] Crear gestión de permisos de usuario

### 6.3 Integración con Stripe
- [ ] Implementar webhook handler para suscripciones
- [ ] Crear función upsert para datos de Stripe
- [ ] Desarrollar sincronización de estados
- [ ] Implementar manejo de cancelaciones

### 6.4 Consultas Avanzadas
- [ ] Crear consultas con relaciones (include/select)
- [ ] Implementar filtros por estado de suscripción
- [ ] Desarrollar consultas de auditoría
- [ ] Crear reportes de actividad de usuarios

---

## FASE 7: Documentación y Finalización

### 7.1 Documentación Técnica
- [ ] Actualizar README con información del esquema
- [ ] Documentar comandos de migración utilizados
- [ ] Crear guía de uso para desarrolladores
- [ ] Documentar integración con Stripe y Clerk

### 7.2 Validación Final
- [ ] Ejecutar `pnpm prisma validate` para verificar schema
- [ ] Confirmar que todas las migraciones están aplicadas
- [ ] Verificar que el cliente Prisma funciona correctamente
- [ ] Probar todas las operaciones CRUD implementadas

### 7.3 Preparación para Producción
- [ ] Verificar configuración de variables de entorno
- [ ] Confirmar que las migraciones están listas para deploy
- [ ] Validar que los índices están optimizados
- [ ] Revisar que las restricciones de seguridad están en lugar

---

## Consideraciones Importantes

### Seguridad
- Todas las tablas usan prefijo `user_` según normas del proyecto
- No modificar tablas con prefijo `els_` (backend Python independiente)
- Validación de datos mediante restricciones CHECK en lugar de ENUM
- Campos sensibles almacenados de forma segura

### Rendimiento
- Índices estratégicos por `userId` en todas las tablas
- Índice adicional por `stripePriceId` para consultas de planes
- Uso de BigInt para IDs de alta concurrencia
- Optimización de consultas con relaciones

### Mantenimiento
- Comentarios SQL completos para documentación
- Estructura flexible para cambios futuros de Stripe
- Logging completo para auditoría y debugging
- Separación clara entre datos internos y externos (Stripe)

### Integración
- Compatible con Clerk para autenticación
- Integración completa con webhooks de Stripe
- Soporte para impuestos españoles (IGIC vs IVA)
- Preparado para Next.js 15 y Prisma ORM