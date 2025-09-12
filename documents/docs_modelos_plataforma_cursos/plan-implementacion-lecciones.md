# Plan de Implementación: Sistema de Lecciones

## 📋 Resumen Ejecutivo

Implementar un sistema de lecciones que sigue el mismo patrón arquitectónico y de diseño que los sistemas existentes de cursos y diapositivas, manteniendo coherencia visual y funcional.

### Objetivos Principales
- ✅ Crear estructura de rutas `/lecciones/` y `/lecciones/[slug]/`
- ✅ Implementar control de acceso basado en campo `features` (OPEN, FREE, PREMIUM)
- ✅ Mantener coherencia visual con cursos y diapositivas
- ✅ Filtrar contenido por estado "activo" únicamente
- ✅ Mostrar contenido granular según permisos de usuario

---

## 🏗️ Arquitectura del Sistema

### Base de Datos (DB2 - Solo Lectura)
- **Tabla**: `els_db_lecciones`
- **Campos Principales**:
  - `estado`: enum('borrador','activo','inactivo','archivado') - Solo mostrar 'activo'
  - `features`: VARCHAR(50) - Valores: "OPEN", "FREE", "PREMIUM"
  - `titulo`: varchar(255) - Título de la lección
  - `url_remota`: text - URL de imagen
  - `contenido_publico`: longtext - Contenido HTML público
  - `contenido_privado`: longtext - Contenido HTML privado
  - `descripcion_corta`: LONGTEXT - Para grid
  - `meta_description`: varchar(500) - SEO
  - `meta_titulo`: varchar(500) - SEO
  - `slug`: varchar(255) - Para rutas

### Reglas de Acceso Implementadas

#### 1. Contenido Público (OPEN)
- **Usuario desconectado**: `contenido_publico` + mensaje "Regístrate para ver más"
- **Usuario conectado (cualquier tipo)**: `contenido_publico` sin mensajes

#### 2. Contenido Gratuito (FREE)
- **Usuario desconectado**: `contenido_publico` + mensaje "Regístrate para ver más"
- **Usuario conectado (FREE/PREMIUM cualquier estado)**: `contenido_privado` completo

#### 3. Contenido Premium (PREMIUM)
- **Usuario desconectado/FREE/PREMIUM caducado**: `contenido_publico` + mensaje "Actualiza a Premium para ver más"
- **Usuario PREMIUM activo ('active', 'trialing')**: `contenido_privado` completo

---

## 🚀 FASE 1: Preparación y Estructura Base

### 1.1 Creación de Estructura de Archivos
```
app/lecciones/
├── page.tsx                 # Listado de lecciones (grid)
├── [slug]/
│   ├── page.tsx             # Vista individual de lección
│   ├── loading.tsx          # Loading state
│   └── components/
│       └── LeccionView.tsx  # Componente de vista individual
├── loading.tsx              # Loading del listado
└── components/
    ├── LeccionCard.tsx      # Card para el grid
    ├── LeccionesGrid.tsx    # Grid container
    └── SearchAndFilters.tsx # Filtros y búsqueda
```

**✅ Checklist Fase 1.1:**
- [ ] Crear directorio `app/lecciones/`
- [ ] Crear archivo `app/lecciones/page.tsx`
- [ ] Crear directorio `app/lecciones/[slug]/`
- [ ] Crear archivo `app/lecciones/[slug]/page.tsx`
- [ ] Crear directorio `app/lecciones/components/`
- [ ] Crear directorio `app/lecciones/[slug]/components/`
- [ ] Crear archivos loading.tsx necesarios

### 1.2 Extensión del Servicio de Contenido
Añadir métodos específicos para lecciones en `@/lib/services`:

```typescript
// Métodos necesarios:
- getLeccionesPaginados()
- getLeccionBySlug()
- getContenidoLeccion() // Similar a getContenidoCurso()
```

**✅ Checklist Fase 1.2:**
- [ ] Examinar servicio existente `contenidoService`
- [ ] Identificar métodos de cursos a replicar para lecciones
- [ ] Implementar `getLeccionesPaginados()`
- [ ] Implementar `getLeccionBySlug()`
- [ ] Implementar `getContenidoLeccion()`
- [ ] Añadir tipo TypeScript `Leccion` si no existe

---

## 🚀 FASE 2: Componentes de Interfaz

### 2.1 Componente LeccionCard (Grid)
Basado en `CursoCard.tsx`, mostrando:
- Imagen: `url_remota`
- Título: `<h3>` con `titulo`
- Descripción: `<p>` con `descripcion_corta` (HTML removido)
- Badge de acceso según `features`
- Fecha de creación
- Link a `/lecciones/{slug}`

**✅ Checklist Fase 2.1:**
- [ ] Copiar estructura base de `CursoCard.tsx`
- [ ] Adaptar props para tipo `Leccion`
- [ ] Implementar badges de acceso (OPEN/FREE/PREMIUM)
- [ ] Configurar aspect ratio de imagen
- [ ] Añadir efectos hover y transiciones
- [ ] Procesar `descripcion_corta` removiendo HTML
- [ ] Configurar routing a `/lecciones/[slug]`

### 2.2 Componente LeccionesGrid
Container del grid, similar a `CursosGrid.tsx`:
- Grid responsivo
- Estado vacío
- Skeleton loading states

**✅ Checklist Fase 2.2:**
- [ ] Copiar estructura de `CursosGrid.tsx`
- [ ] Adaptar para componente `LeccionCard`
- [ ] Configurar grid responsivo (1-4 columnas)
- [ ] Implementar estado vacío con mensaje apropiado
- [ ] Añadir loading skeletons opcionales

### 2.3 Componente LeccionView (Vista Individual)
Basado en `CursoView.tsx`, con orden específico:

1. **Imagen Principal**: `url_remota` con aspect ratio optimizado
2. **Título**: `<h1>` con `titulo`
3. **Contenido Condicional**: Según `features` y usuario
4. **Meta Información**: `meta_description` y `meta_titulo`

**✅ Checklist Fase 2.3:**
- [ ] Copiar estructura base de `CursoView.tsx`
- [ ] Implementar orden específico de elementos
- [ ] Configurar imagen principal con prioridad
- [ ] Implementar lógica de contenido condicional
- [ ] Añadir sección de meta información
- [ ] Configurar badges de acceso
- [ ] Implementar mensajes CTA según tipo de usuario

---

## 🚀 FASE 3: Páginas y Routing

### 3.1 Página de Listado (/lecciones)
Basada en `app/cursos/page.tsx`:
- Paginación
- Filtros por `features`
- Búsqueda por texto
- Ordenamiento
- Solo lecciones con estado "activo"

**✅ Checklist Fase 3.1:**
- [ ] Copiar estructura de `app/cursos/page.tsx`
- [ ] Configurar llamada a `getLeccionesPaginados()`
- [ ] Implementar filtros específicos de lecciones
- [ ] Configurar metadatos SEO
- [ ] Añadir breadcrumbs si necesario
- [ ] Implementar contador de resultados
- [ ] Añadir componente de paginación

### 3.2 Página Individual (/lecciones/[slug])
Basada en `app/cursos/[slug]/page.tsx`:
- Obtención de datos por slug
- Manejo de 404
- Metadatos dinámicos
- Detección de tipo de usuario

**✅ Checklist Fase 3.2:**
- [ ] Copiar estructura de `app/cursos/[slug]/page.tsx`
- [ ] Configurar llamada a `getLeccionBySlug()`
- [ ] Implementar `generateMetadata()` dinámico
- [ ] Configurar manejo de errores 404
- [ ] Integrar detección de tipo de usuario
- [ ] Configurar `LeccionView` component

### 3.3 Componentes de Búsqueda y Filtros
Reutilizar o adaptar componentes existentes:
- SearchAndFilters
- Pagination

**✅ Checklist Fase 3.3:**
- [ ] Evaluar reutilización de componentes existentes
- [ ] Adaptar filtros específicos para lecciones
- [ ] Configurar opciones de filtro por `features`
- [ ] Implementar búsqueda por título/descripción
- [ ] Añadir ordenamiento por fecha/título

---

## 🚀 FASE 4: Lógica de Acceso y Contenido

### 4.1 Implementación de Control de Acceso
Basado en `contenidoService.getContenidoCurso()`:

```typescript
getContenidoLeccion(leccion: Leccion, tipoUsuario: TipoUsuario) {
  // Lógica específica según features y tipoUsuario
}
```

**✅ Checklist Fase 4.1:**
- [ ] Implementar lógica para contenido OPEN
- [ ] Implementar lógica para contenido FREE
- [ ] Implementar lógica para contenido PREMIUM  
- [ ] Añadir mensajes contextuales apropiados
- [ ] Manejar casos edge (features null/undefined)
- [ ] Testear todas las combinaciones usuario/contenido

### 4.2 Mensajes y CTA según Usuario
- Usuario sin login: "Regístrate para ver más"
- Usuario FREE con contenido PREMIUM: "Actualiza a Premium para ver más"
- Botones de acción apropiados

**✅ Checklist Fase 4.2:**
- [ ] Implementar mensajes contextuales
- [ ] Crear CTAs para registro
- [ ] Crear CTAs para upgrade Premium
- [ ] Diseñar cards informativos
- [ ] Configurar enlaces a páginas de registro/upgrade

---

## 🚀 FASE 5: Estilizado y UX

### 5.1 Coherencia Visual
Mantener consistencia con cursos y diapositivas:
- Paleta de colores
- Typography
- Espaciado
- Animaciones
- Badges y componentes UI

**✅ Checklist Fase 5.1:**
- [ ] Verificar uso de clases Tailwind consistentes
- [ ] Mantener paleta de colores existente
- [ ] Usar componentes UI/shadcn coherentes
- [ ] Replicar animaciones y transiciones
- [ ] Asegurar responsive design

### 5.2 Badges de Acceso Diferenciados
- OPEN: Badge secundario con icono Globe
- FREE: Badge outline con icono Shield
- PREMIUM: Badge amber con icono Lock

**✅ Checklist Fase 5.2:**
- [ ] Implementar `AccessBadge` component reutilizable
- [ ] Configurar colores y estilos específicos
- [ ] Añadir iconos apropiados (lucide-react)
- [ ] Testear visibilidad y contraste
- [ ] Asegurar accesibilidad

---

## 🚀 FASE 6: Testing y Optimización

### 6.1 Pruebas Funcionales
- Todos los tipos de usuario y contenido
- Enlaces y navegación
- Responsive design
- Estados de loading
- Manejo de errores

**✅ Checklist Fase 6.1:**
- [ ] Probar usuario sin login + contenido OPEN
- [ ] Probar usuario sin login + contenido FREE
- [ ] Probar usuario sin login + contenido PREMIUM
- [ ] Probar usuario FREE + todos los contenidos  
- [ ] Probar usuario PREMIUM activo + todos los contenidos
- [ ] Probar usuario PREMIUM caducado + todos los contenidos
- [ ] Verificar paginación y filtros
- [ ] Testear responsive en móvil/tablet/desktop
- [ ] Verificar estados de loading
- [ ] Probar enlaces rotos y 404s

### 6.2 Performance y SEO
- Metadatos dinámicos
- Imágenes optimizadas
- Core Web Vitals
- Estructura de datos LD+JSON si necesario

**✅ Checklist Fase 6.2:**
- [ ] Verificar metadatos dinámicos funcionando
- [ ] Configurar images con Next.js Image
- [ ] Testear Core Web Vitals
- [ ] Validar HTML semántico
- [ ] Verificar indexabilidad para contenido OPEN

---

## 🚀 FASE 7: Integración y Deployment

### 7.1 Integración con Sistema Existente
- Verificar no conflictos con rutas
- Links desde otras secciones
- Navegación global
- Sitemap updates

**✅ Checklist Fase 7.1:**
- [ ] Verificar routing no conflictúa
- [ ] Añadir links desde header/footer si necesario
- [ ] Actualizar navegación principal
- [ ] Considerar añadir a sitemap.xml
- [ ] Verificar breadcrumbs si existen

### 7.2 Comandos de Build y Lint
- `pnpm build` sin errores
- `pnpm lint` sin warnings
- TypeScript compilation limpia
- Tests si existen

**✅ Checklist Fase 7.2:**
- [ ] Ejecutar `pnpm build` y verificar éxito
- [ ] Ejecutar `pnpm lint` y corregir issues
- [ ] Verificar TypeScript compilation
- [ ] Correr tests existentes
- [ ] Verificar no regresiones

---

## 📋 Consideraciones Técnicas Específicas

### Patrones a Seguir
1. **Reutilizar servicios existentes**: Extender `contenidoService`
2. **Mantener tipado TypeScript**: Usar/crear tipos apropiados
3. **Seguir convenciones**: Mismos patrones de naming y estructura
4. **HTML crudo**: Usar `dangerouslySetInnerHTML` para contenido
5. **Imágenes**: Next.js Image component con optimización
6. **Estados**: Loading, error, y empty states consistentes

### Campos de Base de Datos
- ✅ `estado = 'activo'` - Filtro obligatorio
- ✅ `features` - Control de acceso granular
- ✅ `url_remota` - Imagen principal
- ✅ `contenido_publico` - HTML para usuarios sin acceso completo
- ✅ `contenido_privado` - HTML para usuarios con acceso
- ✅ `titulo` - H1 en vista individual, H3 en grid
- ✅ `descripcion_corta` - Para cards del grid (remover HTML)
- ✅ `meta_description` y `meta_titulo` - SEO dinámico

### Arquitectura de Components
```
LeccionView
├── Imagen principal (url_remota)
├── Título (H1)
├── ContentByPermission
│   ├── Contenido HTML (público/privado)
│   ├── Mensajes contextuales
│   └── CTAs según usuario
└── Meta información
```

---

## 🎯 Entregables Finales

1. **✅ Estructura completa `/lecciones/`** con páginas y componentes
2. **✅ Control de acceso funcional** según reglas de negocio
3. **✅ Coherencia visual** con sistema existente
4. **✅ SEO optimizado** con metadatos dinámicos
5. **✅ Responsive design** para todos los dispositivos
6. **✅ Estados de loading/error** apropiados
7. **✅ Performance optimizada** con Next.js best practices

---

## 📝 Notas de Implementación

- **Base de trabajo**: Usar cursos como template principal
- **Prioridad**: Funcionalidad primero, refinamiento después
- **Testing**: Probar cada combinación usuario/contenido
- **Coherencia**: Mantener mismos patterns y convenciones
- **Performance**: Optimizar imágenes y loading states
- **SEO**: Metadatos dinámicos para indexación correcta

Este plan proporciona una hoja de ruta completa para implementar el sistema de lecciones manteniendo la calidad y coherencia del sistema existente.