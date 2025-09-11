# Plan de Implementación: Sistema de Cursos

## Análisis de Campos de Base de Datos DB2

### Tabla: els_db_cursos

**Campos Principales:**

- `titulo` (varchar 255) - Título principal
- `slug` (varchar 255) - URL amigable
- `url_remota` (text) - URL imagen CDN
- `estado` (enum) - 'borrador', 'activo', 'inactivo', 'archivado'
- `features` (varchar 50) - 'OPEN', 'FREE', 'PREMIUM'
- `contenido_publico` (longtext) - HTML para usuarios sin login
- `contenido_privado` (longtext) - HTML para usuarios autenticados
- `descripcion_corta` (longtext) - Para cards del grid

**Campos Meta SEO:**

- `meta_titulo` (varchar 500) - 50-60 caracteres
- `meta_description` (varchar 500) - 150-160 caracteres

## Lógica de Permisos por Features del Curso

### Cursos con features = "OPEN" (Acceso Público)

- **Usuarios sin login:** ✅ `contenido_publico` solamente
- **Usuarios con login FREE:** ✅ `contenido_privado` solo si le pertenece (NO contenido_publico)
- **Usuarios con login PREMIUM:** ✅ `contenido_privado` solo si le pertenece (NO contenido_publico)

### Cursos con features = "FREE" (Acceso Autenticado)

- **Usuarios sin login:** mostramos solo el `contenido_publico` ❌ Sin acceso - Mostrar mensaje "Regístrate para acceder"
- **Usuarios con login FREE:** ✅ `contenido_privado`
- **Usuarios con login PREMIUM:** ✅ `contenido_privado`

### Cursos con features = "PREMIUM" (Acceso Pagado)

- **Usuarios sin login:** mostramos solo el `contenido_publico` ❌ Sin acceso - Mostrar mensaje "Regístrate para acceder"
- **Usuarios con login FREE:** ❌ Sin acceso a `contenido_privado` - Mostrar mensaje "Actualiza a Premium" y mostramos `contenido_publico`
- **Usuarios con login PREMIUM (active/trialing):** ✅ `contenido_privado`

## Fases de Implementación

### Fase 1: Configuración Base (45 min)

- [ ] Verificar schema DB2 tiene campo `features`
- [ ] Crear estructura de carpetas `/cursos/`
- [ ] Configurar rutas base
- [ ] Crear layout básico con ShadCN

### Fase 2: Servicios de Datos (60 min)

- [ ] Extender `ContenidoService` con métodos para cursos
- [ ] Implementar `getCursosPaginados()` con filtros por `features`
- [ ] Implementar `getCursoBySlug()` con lógica de permisos
- [ ] Crear lógica de contenido según tipo de usuario
- [ ] Manejar filtrado por `estado = 'activo'`

### Fase 3: Página Individual de Curso (75 min)

- [ ] Crear `app/cursos/[slug]/page.tsx`
- [ ] Implementar componente `CursoView`
- [ ] Mostrar imagen CDN (url_remota)
- [ ] Mostrar título H1
- [ ] Lógica condicional de contenido:
  - [ ] Usuarios desconectados → `contenido_publico`
  - [ ] Usuarios FREE + features "FREE" → `contenido_privado`
  - [ ] Usuarios PREMIUM + features "PREMIUM" → `contenido_privado`
- [ ] Configurar meta tags dinámicos
- [ ] Manejar estados de error (404, sin permisos)

### Fase 4: Página Lista de Cursos (90 min)

- [ ] Crear `app/cursos/page.tsx`
- [ ] Implementar componente `CursosGrid`
- [ ] Crear componente `CursoCard` reutilizable:
  - [ ] Imagen (url_remota)
  - [ ] Título H3 (titulo)
  - [ ] Descripción P (descripcion_corta)
- [ ] Agregar sistema de paginación (reutilizar de diapositivas)
- [ ] Filtros y búsqueda básica
- [ ] Indicadores visuales de tipo (OPEN/FREE/PREMIUM)

### Fase 5: Componentes UI Avanzados (60 min)

- [ ] Loading states y skeletons
- [ ] Estados vacíos elegantes
- [ ] Indicadores de acceso restringido
- [ ] Badges para identificar tipo de curso
- [ ] Responsive design

### Fase 6: Integración y Testing (30 min)

- [ ] Verificar compilación sin errores TypeScript
- [ ] Probar todos los tipos de permisos
- [ ] Validar meta tags SEO
- [ ] Testing responsive
- [ ] Optimización de imágenes

## Estructura de Archivos Propuesta

```
app/cursos/
├── page.tsx                    # Lista con paginación y filtros
├── loading.tsx                 # Loading estado lista
├── [slug]/
│   ├── page.tsx               # Vista individual con lógica de permisos
│   └── loading.tsx            # Loading estado individual
└── components/
    ├── CursoView.tsx          # Componente vista individual
    ├── CursosGrid.tsx         # Grid de cursos
    ├── CursoCard.tsx          # Card individual con badges
    ├── AccessBadge.tsx        # Badge indicador de tipo acceso
    └── ContentByPermission.tsx # Componente lógica condicional
```

## URLs Resultantes

- `/cursos` → Lista paginada con filtros
- `/cursos?page=2` → Lista página 2
- `/cursos?tipo=PREMIUM` → Filtro por tipo de acceso
- `/cursos/principios-de-electronica` → Curso específico

## Lógica de Contenido Detallada

### Usuario Desconectado (público)

```typescript
if (tipoUsuario === 'publico') {
  if (curso.features === 'OPEN') {
    mostrar: curso.contenido_publico
  } else {
    mostrar: mensaje "Regístrate para acceder"
  }
}
```

### Usuario FREE

```typescript
if (tipoUsuario === 'free') {
  if (curso.features === 'OPEN') {
    mostrar: curso.contenido_privado  // NO contenido_publico
  } else if (curso.features === 'FREE') {
    mostrar: curso.contenido_privado
  } else if (curso.features === 'PREMIUM') {
    mostrar: mensaje "Actualiza a Premium"
  }
}
```

### Usuario PREMIUM

```typescript
if (tipoUsuario === "premium") {
	if (curso.features === "OPEN") {
		mostrar: curso.contenido_privado; // NO contenido_publico
	} else if (curso.features === "FREE") {
		mostrar: curso.contenido_privado;
	} else if (curso.features === "PREMIUM") {
		mostrar: curso.contenido_privado;
	}
}
```

## Componentes Reutilizables

### AccessBadge

```tsx
// Badges para identificar tipo de curso
OPEN → Badge verde "Acceso libre"
FREE → Badge azul "Registro requerido"
PREMIUM → Badge dorado "Premium"
```

### ContentByPermission

```tsx
// Componente que maneja la lógica condicional de contenido
// según tipo de usuario y features del curso
```

## Meta Tags SEO

- `title`: meta_titulo (50-60 chars)
- `description`: meta_description (150-160 chars)
- `og:image`: url_remota
- `og:title`: titulo
- `canonical`: /cursos/[slug]

## Consideraciones Técnicas

### Performance

- Lazy loading de imágenes
- Paginación optimizada
- Cache de queries frecuentes

### UX/UI

- Consistencia visual con diapositivas
- Indicadores claros de tipo de acceso
- Mensajes informativos para restricciones
- Loading states suaves

### SEO

- Meta tags dinámicos por curso
- URLs amigables con slugs
- Contenido estructurado para crawlers

## Tiempo Total Estimado

**5.5 horas** distribuidas en 6 fases progresivas

Este plan mantiene la coherencia visual con el sistema de diapositivas mientras implementa la lógica de permisos granular requerida para los cursos.
