# Implementación de Listado de Lecciones en Página Individual de Curso

## Objetivo
Añadir una sección bajo el contenido privado del curso que muestre el listado de lecciones pertenecientes a ese curso, usando ShadCN UI y soporte para modo claro/oscuro.

## Arquitectura de Base de Datos

### Tablas Involucradas (DB2):
1. **`els_db_cursos`** - Tabla principal de cursos
2. **`els_rel_curso_leccion`** - Tabla de relación intermedia
3. **`els_db_lecciones`** - Tabla principal de lecciones

### Relación:
- Relación muchos-a-muchos entre cursos y lecciones
- Campo `indice` en tabla de relación para ordenamiento
- Una lección puede pertenecer a múltiples cursos

## Fases de Implementación

### FASE 1: Preparación del Servicio de Contenido
- [ ] Crear método `getLeccionesByCursoId()` en `contenidoService.ts`
- [ ] Implementar consulta con JOIN entre las 3 tablas
- [ ] Ordenar resultados por campo `indice` (ASC)
- [ ] Incluir campos necesarios: id, titulo, descripcion_corta, slug, fecha_creacion
- [ ] Manejar casos donde no hay lecciones asociadas

### FASE 2: Modificación de la Página de Curso
- [ ] Modificar `getCursoBySlugAbierto()` para incluir relaciones de lecciones
- [ ] Actualizar interfaz `CursoViewProps` si es necesario
- [ ] Pasar datos de lecciones al componente `CursoView`

### FASE 3: Actualización del Componente CursoView
- [ ] Importar componentes de ShadCN necesarios (Card, Button, etc.)
- [ ] Añadir sección `<h3>Listado de las lecciones</h3>` bajo contenido privado
- [ ] Crear componente interno `LeccionesList` para el listado
- [ ] Implementar diseño responsive
- [ ] Asegurar compatibilidad con modo claro/oscuro

### FASE 4: Componente de Lista de Lecciones
- [ ] Crear componente `LeccionCard` para cada lección individual
- [ ] Mostrar: título, descripción corta, fecha de creación
- [ ] Implementar hover effects y estados
- [ ] Añadir indicador de orden/índice
- [ ] Manejar estado vacío (sin lecciones)

### FASE 5: Navegación a Páginas Individuales
- [ ] Verificar existencia de rutas `/lecciones/[slug]`
- [ ] Implementar navegación con `Link` de Next.js
- [ ] Usar slug de la lección para la URL
- [ ] Añadir indicadores visuales de enlace

### FASE 6: Testing y Refinamiento
- [ ] Probar con cursos que tienen lecciones
- [ ] Probar con cursos sin lecciones
- [ ] Verificar ordenamiento correcto por índice
- [ ] Testear navegación a páginas de lecciones
- [ ] Validar diseño en modo claro/oscuro
- [ ] Verificar responsive design

## Estructura de Datos Esperada

```typescript
interface CursoConLecciones extends Curso {
  lecciones: Array<{
    id: number
    titulo: string
    descripcion_corta: string | null
    slug: string | null
    fecha_creacion: Date
    indice: number
  }>
}
```

## Consulta SQL Objetivo

```sql
SELECT 
    l.id,
    l.titulo,
    l.descripcion_corta,
    l.slug,
    l.fecha_creacion,
    rel.indice
FROM els_db_lecciones l
INNER JOIN els_rel_curso_leccion rel ON l.id = rel.leccion_id
WHERE rel.curso_id = [ID_DEL_CURSO]
  AND l.estado = 'activo'
ORDER BY rel.indice ASC;
```

## Componentes ShadCN a Utilizar
- [ ] Card (para cada lección)
- [ ] Badge (para mostrar índice/orden)
- [ ] Button (para navegación)
- [ ] Separator (para división visual)
- [ ] Typography (para textos consistentes)

## Consideraciones de UX/UI
- [ ] Loading states mientras cargan las lecciones
- [ ] Estado vacío elegante cuando no hay lecciones
- [ ] Hover effects sutiles
- [ ] Transiciones suaves
- [ ] Accesibilidad (aria-labels, focus management)
- [ ] Indicadores visuales claros para enlaces

## Rutas a Verificar/Crear
- [ ] `/cursos/[slug]` - Página actual (ya existe)
- [ ] `/lecciones/[slug]` - Páginas individuales de lecciones (verificar existencia)

## Files a Modificar/Crear
1. `lib/services/contenidoService.ts` - Nuevo método
2. `app/cursos/[slug]/components/CursoView.tsx` - Añadir sección de lecciones
3. `app/cursos/[slug]/page.tsx` - Pasar datos de lecciones
4. Posible: `app/lecciones/[slug]/page.tsx` - Si no existe

## Criterios de Éxito
- ✅ Las lecciones se muestran ordenadas por índice
- ✅ El diseño es consistente con ShadCN
- ✅ Funciona en modo claro y oscuro
- ✅ La navegación a lecciones individuales funciona
- ✅ Se maneja correctamente el caso sin lecciones
- ✅ El diseño es responsive
- ✅ La experiencia de usuario es fluida

## Notas Técnicas
- Usar Prisma ORM con cliente DB2
- Mantener acceso abierto (sin restricciones de usuario)
- Preservar SEO con metadatos apropiados
- Optimizar consultas de base de datos
- Cachear resultados si es necesario