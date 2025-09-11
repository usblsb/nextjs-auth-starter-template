# Plan de Implementación: Sistema de Diapositivas

## Análisis de Campos de Base de Datos

Basado en el schema de `Diapositiva`:

### Campos Principales
- `titulo` (varchar 255) - Título principal
- `slug` (varchar 255) - URL amigable 
- `contenido` (text) - HTML raw del contenido
- `url_remota` (varchar 255) - URL imagen CDN (1980px ancho)

### Campos Meta SEO
- `meta_titulo` (varchar 500) - 50-60 caracteres
- `meta_description` (varchar 500) - 150-160 caracteres

### Campos de Estado
- `estado` (varchar 20) - Control de publicación
- `fecha_creacion` - Timestamp
- `fecha_actualizacion` - Timestamp

## Fases de Implementación

### Fase 1: Estructura Base (30 min)
- [ ] Crear estructura de carpetas `/diapositivas/`
- [ ] Configurar rutas base
- [ ] Crear layout básico con ShadCN

### Fase 2: Página Individual (45 min)
- [ ] Crear `app/diapositivas/[slug]/page.tsx`
- [ ] Implementar componente `DiapositivaView`
- [ ] Configurar meta tags dinámicos
- [ ] Manejar estados de error (404, acceso denegado)

### Fase 3: Página Lista (60 min)
- [ ] Crear `app/diapositivas/page.tsx`
- [ ] Implementar componente `DiapositivasGrid`
- [ ] Agregar sistema de paginación con ShadCN
- [ ] Filtros y búsqueda básica

### Fase 4: Servicios de Datos (30 min)
- [ ] Extender `ContenidoService` con paginación
- [ ] Optimizar queries de diapositivas
- [ ] Manejar permisos por tipo de usuario

### Fase 5: Componentes UI (45 min)
- [ ] Componente `DiapositivaCard` para grid
- [ ] Componente `Pagination` reutilizable
- [ ] Loading states y skeletons
- [ ] Responsive design

## Estructura de Archivos Propuesta

```
app/diapositivas/
├── page.tsx                    # Lista con paginación
├── [slug]/
│   ├── page.tsx               # Vista individual
│   └── loading.tsx            # Loading UI
├── components/
│   ├── DiapositivaView.tsx    # Componente vista individual
│   ├── DiapositivasGrid.tsx   # Grid de diapositivas
│   ├── DiapositivaCard.tsx    # Card individual
│   └── Pagination.tsx         # Paginación reutilizable
└── layout.tsx                 # Layout específico
```

## Componente Individual - Estructura Visual

```
[IMAGEN CDN 1980px] (url_remota)
[H1 TÍTULO] (titulo)
[CONTENIDO HTML] (contenido)
```

## URLs Resultantes
- `/diapositivas` → Lista con paginación (página 1)
- `/diapositivas?page=2` → Lista página 2
- `/diapositivas/que-es-la-electricidad-d36be` → Diapositiva específica

## Meta Tags Dinámicos
- `title`: meta_titulo (50-60 chars)
- `description`: meta_description (150-160 chars)
- `og:image`: url_remota
- `og:title`: titulo
- `canonical`: /diapositivas/[slug]

## Permisos por Tipo de Usuario
- **Público**: Sin acceso (redirect a sign-in)
- **Free**: Acceso limitado a diapositivas básicas
- **Premium**: Acceso completo a todas las diapositivas

## Ejemplo de Datos
```
titulo: "¿Qué es la electricidad?"
slug: "que-es-la-electricidad-d36be"
url_remota: "https://electronica-school.b-cdn.net/static/fotos/diapositivas/que-es-la-electricidad-04e06b3e.jpeg"
contenido: "<p>La electricidad es un fenómeno físico y una forma de energía...</p>"
meta_titulo: "¿Qué es la electricidad? - Conceptos básicos de electrónica"
meta_description: "Descubre qué es la electricidad, cómo se manifiesta y por qué es fundamental en la electrónica. Aprende los conceptos básicos de manera sencilla."
```