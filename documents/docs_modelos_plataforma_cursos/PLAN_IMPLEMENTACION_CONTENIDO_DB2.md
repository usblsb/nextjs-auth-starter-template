# Plan de Implementación de Contenido de DB2 en NextJS

## Resumen del Proyecto

Este documento describe el plan para integrar y mostrar el contenido almacenado en la base de datos DB2 (NEON.COM Frankfurt) en nuestra aplicación NextJS con Clerk. La DB2 contiene cursos, lecciones y diapositivas generados por una aplicación externa.

## Estructura de Base de Datos DB2

### Tablas Principales

1. **els_db_cursos** - Cursos disponibles
2. **els_db_lecciones** - Lecciones individuales  
3. **els_db_diapositivas** - Diapositivas multimedia con soporte para IA, audio y video
4. **els_rel_curso_leccion** - Relaciones many-to-many entre cursos y lecciones (con orden)
5. **els_rel_leccion_diapositiva** - Relaciones many-to-many entre lecciones y diapositivas (con orden)

### Modelo de Datos

#### Cursos
- Campos principales: id, titulo, slug, descripcion_corta, descripcion_larga
- SEO: meta_titulo, meta_description
- Contenido: contenido_publico, contenido_privado, contenido
- Estado: borrador, activo, inactivo, archivado
- Multimedia: imagen, hash_imagen, url_remota

#### Lecciones
- Estructura similar a cursos
- Campos principales: id, titulo, slug, descripcion_corta, descripcion_larga
- Contenido público/privado diferenciado
- Sistema de imágenes con sincronización local/remoto

#### Diapositivas
- Soporte multimedia completo: imagen, audio, video
- Integración con IA: system_prompt_text_dp, user_prompt_text_dp, contenido_ai_text_dp
- URLs locales y remotas para archivos multimedia
- Text-to-speech: text_to_audio_dp

## Estrategia de Acceso por Tipo de Usuario

### 1. Usuarios NO autenticados (Google SEO)
- **Contenido visible**: Solo `contenido_publico` de cursos y lecciones
- **Estados mostrados**: Solo elementos con `estado = 'activo'`
- **Restricciones**: Sin acceso a diapositivas ni contenido privado

### 2. Usuarios FREE (autenticados sin suscripción)
- **Contenido visible**: `contenido_publico` + contenido marcado como "FREE"
- **Acceso**: Lecciones básicas y algunas diapositivas introductorias
- **Limitaciones**: Sin acceso a contenido premium

### 3. Usuarios PREMIUM (suscripción activa)
- **Contenido visible**: Acceso completo a todo el contenido
- **Incluye**: `contenido_privado`, todas las diapositivas, multimedia
- **Sin restricciones**: Acceso total a cursos, lecciones y diapositivas

## Arquitectura de Implementación

### 1. Configuración de Base de Datos

```typescript
// prisma/schema.prisma - Agregar modelos DB2
model Curso {
  id                   Int      @id @default(autoincrement())
  titulo               String   @db.VarChar(255)
  slug                 String?  @unique @db.VarChar(255)
  meta_titulo          String?  @db.VarChar(500)
  meta_description     String?  @db.VarChar(500)
  descripcion_corta    String?  @db.Text
  descripcion_larga    String?  @db.Text
  contenido            String?  @db.Text
  contenido_privado    String?  @db.Text
  contenido_publico    String?  @db.Text
  estado               String?  @db.VarChar(20)
  imagen               String?  @db.VarChar(255)
  url_remota           String?  @db.Text
  fecha_creacion       DateTime @default(now())
  fecha_actualizacion  DateTime @updatedAt
  
  // Relaciones
  cursoLecciones       CursoLeccion[]
  
  @@map("els_db_cursos")
}

model Leccion {
  id                   Int      @id @default(autoincrement())
  titulo               String   @db.VarChar(255)
  slug                 String?  @unique @db.VarChar(255)
  // ... campos similares a Curso
  
  cursoLecciones       CursoLeccion[]
  leccionDiapositivas  LeccionDiapositiva[]
  
  @@map("els_db_lecciones")
}

model Diapositiva {
  id                        Int      @id @default(autoincrement())
  titulo                    String   @db.VarChar(255)
  contenido                 String?  @db.Text
  contenido_ai_text_dp      String?  @db.Text
  ruta_url_audio_remoto_dp  String?  @db.VarChar(1000)
  ruta_url_video_remoto_dp  String?  @db.VarChar(1000)
  // ... más campos multimedia
  
  leccionDiapositivas       LeccionDiapositiva[]
  
  @@map("els_db_diapositivas")
}
```

### 2. Servicios de Datos

```typescript
// lib/services/contenidoService.ts
export class ContenidoService {
  
  // Obtener cursos según tipo de usuario
  async getCursos(tipoUsuario: 'publico' | 'free' | 'premium') {
    const whereClause = this.buildWhereClause(tipoUsuario);
    return await prisma.curso.findMany({
      where: { estado: 'activo', ...whereClause },
      include: this.getIncludeClause(tipoUsuario)
    });
  }
  
  // Obtener lecciones de un curso con permisos
  async getLeccionesPorCurso(cursoId: number, tipoUsuario: string) {
    return await prisma.cursoLeccion.findMany({
      where: { curso_id: cursoId },
      include: {
        leccion: {
          where: this.buildLeccionWhereClause(tipoUsuario)
        }
      },
      orderBy: { indice: 'asc' }
    });
  }
  
  // Obtener diapositivas con control de acceso
  async getDiapositivasPorLeccion(leccionId: number, tipoUsuario: string) {
    if (tipoUsuario === 'publico') {
      return []; // Sin acceso a diapositivas
    }
    
    return await prisma.leccionDiapositiva.findMany({
      where: { leccion_id: leccionId },
      include: {
        diapositiva: true
      },
      orderBy: { indice: 'asc' }
    });
  }
  
  private buildWhereClause(tipoUsuario: string) {
    switch(tipoUsuario) {
      case 'publico':
        return { contenido_publico: { not: null } };
      case 'free':
        return { 
          OR: [
            { contenido_publico: { not: null } },
            { /* criterios para contenido FREE */ }
          ]
        };
      case 'premium':
        return {}; // Sin restricciones
    }
  }
}
```

### 3. Componentes de UI

```typescript
// components/curso/CursoCard.tsx
interface CursoCardProps {
  curso: Curso;
  tipoUsuario: 'publico' | 'free' | 'premium';
}

export function CursoCard({ curso, tipoUsuario }: CursoCardProps) {
  const contenidoMostrar = getContenidoSegunTipo(curso, tipoUsuario);
  
  return (
    <div className="curso-card">
      <h3>{curso.titulo}</h3>
      <p>{curso.descripcion_corta}</p>
      
      {tipoUsuario !== 'publico' && (
        <div className="curso-stats">
          <LeccionesCount cursoId={curso.id} />
          <DiapositivasCount cursoId={curso.id} />
        </div>
      )}
      
      {tipoUsuario === 'publico' && (
        <CallToAction />
      )}
    </div>
  );
}
```

### 4. Rutas y Páginas

```typescript
// app/(pages-dashboard)/cursos/page.tsx
export default async function CursosPage() {
  const { userId } = auth();
  const tipoUsuario = await getTipoUsuario(userId);
  
  const cursos = await contenidoService.getCursos(tipoUsuario);
  
  return (
    <div className="cursos-container">
      <h1>Cursos de Electrónica</h1>
      <div className="cursos-grid">
        {cursos.map(curso => (
          <CursoCard 
            key={curso.id} 
            curso={curso} 
            tipoUsuario={tipoUsuario} 
          />
        ))}
      </div>
    </div>
  );
}

// app/(pages-dashboard)/cursos/[slug]/page.tsx
export default async function CursoDetallePage({ params }: { params: { slug: string }}) {
  const curso = await getCursoBySlug(params.slug);
  const lecciones = await getLeccionesPorCurso(curso.id);
  
  return <CursoDetalle curso={curso} lecciones={lecciones} />;
}
```

## Fases de Implementación

### Fase 1: Configuración Base (Semana 1)
- [ ] Configurar conexión a DB2 en Prisma
- [ ] Crear modelos de datos en schema.prisma
- [ ] Generar cliente Prisma para DB2
- [ ] Crear servicios básicos de consulta

### Fase 2: Lógica de Negocio (Semana 2)
- [ ] Implementar sistema de permisos por tipo de usuario
- [ ] Crear servicios de contenido con filtrado
- [ ] Desarrollar utilidades de navegación (breadcrumbs, paginación)
- [ ] Implementar caché y optimizaciones de consulta

### Fase 3: Interfaz de Usuario (Semana 3)
- [ ] Crear componentes de curso, lección y diapositiva
- [ ] Implementar navegación secuencial
- [ ] Desarrollar reproductor multimedia para diapositivas
- [ ] Crear sistema de progreso y marcadores

### Fase 4: Funcionalidades Avanzadas (Semana 4)
- [ ] Implementar búsqueda y filtros
- [ ] Crear sistema de favoritos (almacenar en DB1)
- [ ] Desarrollar analytics de uso
- [ ] Implementar export/share de contenido

## Consideraciones Técnicas

### Seguridad
- Validación estricta de permisos en cada consulta
- Sanitización de contenido HTML
- Rate limiting para APIs de contenido
- Logs de acceso a contenido premium

### Performance
- Índices optimizados en DB2
- Caché de contenido frecuentemente accedido
- Paginación inteligente para listas grandes
- Lazy loading de multimedia

### SEO
- Contenido público indexable por Google
- Meta tags dinámicos desde base de datos
- URLs amigables con slugs
- Sitemap automático generado desde DB2

## Monitoreo y Analytics

### Métricas a Trackear
- Acceso a cursos por tipo de usuario
- Tiempo de permanencia en lecciones
- Diapositivas más visualizadas
- Conversión de usuarios free a premium

### Herramientas
- Vercel Analytics para métricas web
- Logging personalizado en DB1
- Dashboard administrativo para estadísticas

## Conclusión

Esta implementación permitirá mostrar el rico contenido de la plataforma externa de manera segura y escalable, respetando los diferentes niveles de acceso y optimizando tanto para SEO como para experiencia de usuario.

La arquitectura propuesta es flexible y permite futuras extensiones como comentarios, progreso de usuario, certificaciones, etc.