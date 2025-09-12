# Implementación de Navegación de Lecciones en Página Individual de Lección

## Objetivo
Añadir una sección al final del contenido de una lección individual que muestre el listado completo de lecciones que pertenecen al mismo curso, con navegación y ordenamiento apropiado.

## Arquitectura de Base de Datos

### Tablas Involucradas (DB2):
1. **`els_db_lecciones`** - Tabla principal de lecciones (punto de partida)
2. **`els_rel_curso_leccion`** - Tabla de relación intermedia
3. **`els_db_cursos`** - Tabla principal de cursos

### Flujo de Consulta:
**Lección Individual** → **Encontrar Curso** → **Obtener Todas las Lecciones del Curso** → **Mostrar Lista Ordenada**

## Fases de Implementación

### FASE 1: Análisis del Estado Actual
- [ ] Verificar existencia de páginas individuales de lecciones (`/lecciones/[slug]`)
- [ ] Analizar estructura actual del componente de lección
- [ ] Identificar dónde se obtienen los datos de la lección actual
- [ ] Revisar sistema de tipos de usuario (público, free, premium) en lecciones
- [ ] Verificar acceso a base de datos DB2 desde páginas de lecciones

### FASE 2: Extensión del Servicio de Contenido
- [ ] Crear método `getLeccionesHermanasByLeccionId()` en `contenidoService.ts`
- [ ] Implementar consulta en dos pasos:
  - **Paso 1**: Encontrar curso_id desde leccion_id actual
  - **Paso 2**: Obtener todas las lecciones de ese curso
- [ ] Ordenar resultados por campo `indice` (ASC)
- [ ] Manejar caso donde una lección pertenece a múltiples cursos
- [ ] Incluir campos: id, titulo, slug, indice
- [ ] Marcar cuál es la lección actual en el resultado

### FASE 3: Modificación de la Página de Lección Individual
- [ ] Localizar archivo de página individual de lección
- [ ] Modificar para obtener lecciones hermanas usando el nuevo método
- [ ] Pasar datos de lecciones hermanas al componente de vista
- [ ] Mantener compatibilidad con sistema actual de permisos

### FASE 4: Actualización del Componente de Vista de Lección
- [ ] Identificar componente que renderiza la lección individual
- [ ] Añadir props para recibir lista de lecciones hermanas
- [ ] Crear sección después del contenido (público/privado)
- [ ] Añadir `<h3>Listado de las lecciones</h3>`
- [ ] Importar componentes ShadCN necesarios

### FASE 5: Componente de Navegación de Lecciones
- [ ] Crear componente `LeccionNavigation` especializado
- [ ] Diseño simple: título + número de índice
- [ ] Usar mismo esquema de colores que lista de curso
- [ ] Implementar estado activo para lección actual
- [ ] Navegación con `Link` de Next.js a `/lecciones/[slug]`
- [ ] Soporte para modo claro/oscuro

### FASE 6: Casos Especiales y Optimizaciones
- [ ] Manejar lecciones sin curso asociado
- [ ] Gestionar lecciones que pertenecen a múltiples cursos
- [ ] Implementar loading states si es necesario
- [ ] Optimizar consultas de base de datos
- [ ] Añadir indicador visual de lección actual

### FASE 7: Testing y Refinamiento
- [ ] Probar con lecciones que tienen curso asociado
- [ ] Probar con lecciones sin curso asociado  
- [ ] Verificar navegación entre lecciones
- [ ] Testear ordenamiento por índice
- [ ] Validar diseño en modo claro/oscuro
- [ ] Verificar responsive design
- [ ] Testear con diferentes tipos de usuario

## Estructura de Datos Esperada

### Input (Lección Actual):
```typescript
interface LeccionActual {
  id: number
  titulo: string
  slug: string | null
  // ... otros campos de lección
}
```

### Output (Lecciones Hermanas):
```typescript
interface LeccionHermana {
  id: number
  titulo: string
  slug: string | null
  indice: number
  es_leccion_actual: boolean
  curso_id: number
  curso_titulo?: string
}
```

## Consultas SQL Objetivo

### Consulta Completa (Una sola query):
```sql
SELECT 
    l.id,
    l.titulo,
    l.slug,
    rel.indice,
    c.id as curso_id,
    c.titulo as curso_titulo,
    CASE WHEN l.id = [ID_LECCION_ACTUAL] THEN 1 ELSE 0 END as es_leccion_actual
FROM els_db_lecciones l
INNER JOIN els_rel_curso_leccion rel ON l.id = rel.leccion_id
INNER JOIN els_db_cursos c ON rel.curso_id = c.id
WHERE rel.curso_id IN (
    SELECT curso_id 
    FROM els_rel_curso_leccion 
    WHERE leccion_id = [ID_LECCION_ACTUAL]
    LIMIT 1  -- Solo primer curso si pertenece a varios
)
AND l.estado = 'activo'
ORDER BY rel.indice ASC;
```

### Consulta en Dos Pasos (Más control):
```sql
-- Paso 1: Encontrar curso
SELECT curso_id 
FROM els_rel_curso_leccion 
WHERE leccion_id = [ID_LECCION_ACTUAL]
LIMIT 1;

-- Paso 2: Obtener lecciones hermanas
SELECT 
    l.id,
    l.titulo,
    l.slug,
    rel.indice
FROM els_db_lecciones l
INNER JOIN els_rel_curso_leccion rel ON l.id = rel.leccion_id
WHERE rel.curso_id = [CURSO_ID_ENCONTRADO]
AND l.estado = 'activo'
ORDER BY rel.indice ASC;
```

## Especificaciones de Diseño

### Layout:
- **Posición**: Al final del contenido, antes del footer
- **Título**: `<h3>Listado de las lecciones</h3>`
- **Información mostrada**: Solo título + número de índice
- **Esquema de colores**: Igual al usado en lista de curso

### Componentes ShadCN a Utilizar:
- [ ] Card (contenedor de cada lección)
- [ ] Badge (para número de índice)
- [ ] Typography (para consistencia de textos)
- [ ] Variants apropiados para tema claro/oscuro

### Estados Visuales:
- [ ] Estado normal (lección navegable)
- [ ] Estado activo (lección actual) - destacado visualmente
- [ ] Estado hover (efectos de transición)
- [ ] Estado sin curso (manejo de errores)

## Archivos a Localizar/Modificar

### A Identificar:
- [ ] `app/lecciones/[slug]/page.tsx` - Página individual de lección
- [ ] `app/lecciones/[slug]/components/LeccionView.tsx` - Componente de vista
- [ ] O estructura equivalente para lecciones

### A Modificar/Crear:
1. `lib/services/contenidoService.ts` - Nuevo método
2. Página de lección individual - Obtener datos adicionales
3. Componente de vista de lección - Añadir navegación
4. Posible: Componente especializado `LeccionNavigation`

## Consideraciones Técnicas

### Base de Datos:
- Usar cliente Prisma DB2 existente
- Mantener consultas optimizadas
- Cachear resultados si es necesario

### Navegación:
- URLs: `/lecciones/[slug]`
- Preservar historia de navegación
- SEO-friendly con metadatos apropiados

### Accesibilidad:
- [ ] ARIA labels apropiados
- [ ] Focus management en navegación
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

### Rendimiento:
- [ ] Optimizar consultas de base de datos
- [ ] Lazy loading si la lista es muy larga
- [ ] Memoización de componentes si es necesario

## Casos Edge a Considerar

### Datos:
- [ ] Lección sin curso asociado
- [ ] Lección que pertenece a múltiples cursos
- [ ] Curso con una sola lección
- [ ] Lecciones sin slug (no navegables)

### UX:
- [ ] Loading states durante navegación
- [ ] Error states si falla la carga
- [ ] Estado vacío elegante
- [ ] Indicadores de progreso (opcional)

## Criterios de Éxito

- ✅ Las lecciones hermanas se muestran ordenadas por índice
- ✅ La lección actual está visualmente destacada
- ✅ La navegación funciona correctamente
- ✅ El diseño es consistente con la lista de curso
- ✅ Funciona en modo claro y oscuro
- ✅ Se maneja correctamente el caso sin lecciones
- ✅ El diseño es responsive
- ✅ La experiencia de usuario es intuitiva

## Notas Adicionales

### Navegación Futura (Opcional):
- Botones "Anterior/Siguiente" basados en índice
- Breadcrumbs: Curso > Lección X de Y
- Indicador de progreso en el curso
- Enlaces directos al curso padre

### Optimizaciones Futuras:
- Prefetch de lecciones siguiente/anterior
- Transiciones animadas entre lecciones
- Navegación con teclado (flechas)
- Bookmarking de progreso