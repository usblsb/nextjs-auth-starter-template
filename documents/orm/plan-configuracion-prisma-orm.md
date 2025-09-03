# Plan de Configuración Prisma ORM con PostgreSQL Neon.com

## Resumen del Proyecto

Configuración completa de Prisma ORM para conectarse a una base de datos PostgreSQL en Neon.com, diseñada para gestionar datos de usuarios, suscripciones y logs de actividad en una aplicación Next.js con autenticación Clerk.

---

## FASE 1: Instalación y Configuración Inicial de Prisma

### Paso 1.1: Instalación de dependencias

- [ ] Instalar Prisma CLI (>=6.8): `pnpm add prisma@latest @prisma/client@latest`
- [ ] Instalar driver PostgreSQL 17: `pnpm add pg @types/pg`
- [ ] Verificar versiones instaladas: `npx prisma --version` (debe ser >=6.8)
- [ ] **IMPORTANTE**: Usar solo versiones compatibles con Next.js 15

### Paso 1.2: Inicialización de Prisma

- [ ] Ejecutar `npx prisma init` para crear estructura inicial
- [ ] Verificar creación de carpeta `prisma/`
- [ ] Verificar creación de archivo `schema.prisma`
- [ ] Usar variables de `.env` con DATABASE_URL

### Paso 1.3: Configuración de scripts en package.json

- [ ] Agregar script `"db:generate": "prisma generate"`
- [ ] Agregar script `"db:push": "prisma db push"`
- [ ] Agregar script `"db:migrate": "prisma migrate dev"`
- [ ] Agregar script `"db:studio": "prisma studio"`
- [ ] Agregar script `"db:reset": "prisma migrate reset"`

---

## FASE 2: Configuración de Conexión a Base de Datos Neon.com

### Paso 2.1: Configuración de variables de entorno

- [ ] Usar archivo `.env` que ya contiene las variables rellenadas
- [ ] Usar las variables ya establecidas de conexión Neon.com:
  - `DB_HOST=""`
  - `DB_PORT=""`
  - `DB_NAME=""`
  - `DB_USER=""`
  - `DB_PASSWORD=""`
- [ ] Construir DATABASE_URL con formato PostgreSQL

### Paso 2.2: Configuración del schema.prisma

- [ ] **CRÍTICO**: Configurar generator con `prisma-client-js` (NO usar `prisma-client` antiguo):
  ```
  generator client {
    provider = "prisma-client-js"
    // NO agregar configuraciones personalizadas de output para Next.js 15
  }
  ```
- [ ] Configurar datasource db con provider "postgresql"
- [ ] Configurar url desde env("DATABASE_URL")
- [ ] Establecer configuraciones de conexión SSL para Neon.com
- [ ] **ADVERTENCIA**: Evitar configuraciones personalizadas de `output` que causan errores en Next.js 15

### Paso 2.3: Prueba de conexión

- [ ] Ejecutar `npx prisma db push` para probar conexión
- [ ] Verificar conexión exitosa con Neon.com

---

## MEJORES PRÁCTICAS PRISMA >=6.8 + NEXT.JS 15

### ⚠️ Configuraciones Críticas

#### Generator Configuration

- **USAR**: `provider = "prisma-client-js"` (recomendado para Next.js 15)
- **NO USAR**: `provider = "prisma-client"` (versión antigua, causa errores de bundling)
- **EVITAR**: Configuraciones personalizadas de `output` path que interfieren con Next.js 15

#### Instancia Singleton Pattern

```typescript
// Estructura recomendada para lib/prisma.ts
// - Usar globalThis para persistir en desarrollo
// - Implementar lazy initialization
// - Manejar hot reload correctamente
// - Configurar cierre de conexiones
```

#### Compatibilidad de Versiones

- **Prisma**: >=6.8 (última estable)
- **@prisma/client**: Misma versión que Prisma CLI
- **Next.js**: 15.x (verificar compatibilidad)
- **Node.js**: >=18.17.0 (requerido por Prisma 6.8+)

### 🔧 Configuraciones Específicas para Neon.com

#### Connection String Format

```
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

#### SSL Configuration

- Neon.com requiere SSL por defecto
- Configurar `sslmode=require` en connection string
- No necesita certificados adicionales

#### Connection Pooling

- Neon.com maneja pooling automáticamente
- Configurar timeouts apropiados para serverless
- Usar connection limits conservadores

### 🚨 Errores Comunes a Evitar

1. **Multiple Client Instances**: No crear múltiples instancias de PrismaClient
2. **Output Path Customization**: Evitar configurar rutas personalizadas de salida
3. **Version Mismatch**: Mantener sincronizadas las versiones de Prisma CLI y Client
4. **SSL Issues**: Asegurar configuración SSL correcta para Neon.com
5. **Hot Reload Problems**: Implementar singleton correctamente para desarrollo

### 📋 Checklist de Validación

- [ ] Prisma CLI y Client en misma versión >=6.8
- [ ] Generator configurado como `prisma-client-js`
- [ ] Sin configuraciones personalizadas de output
- [ ] Instancia singleton implementada correctamente
- [ ] SSL configurado para Neon.com
- [ ] Connection pooling optimizado
- [ ] Hot reload funcionando sin múltiples instancias
- [ ] Build de producción exitoso
- [ ] Migraciones aplicadas correctamente

---

## Recursos y Referencias

### Documentación oficial

- Prisma Documentation: https://www.prisma.io/docs
- Neon.com Documentation: https://neon.tech/docs
- Clerk Integration: https://clerk.com/docs

### Herramientas útiles

- Prisma Studio para inspección de datos
- Database schema visualization tools
- Performance monitoring tools

### Consideraciones importantes

- Backup strategy antes de migraciones
- Testing en ambiente de desarrollo primero
- Monitoreo de performance post-deployment
- Documentación de cambios para el equipo

---

**Nota**: Este plan debe ejecutarse secuencialmente, completando cada fase antes de proceder a la siguiente. Cada paso debe ser validado antes de continuar.
