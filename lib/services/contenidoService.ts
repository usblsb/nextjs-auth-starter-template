import { db2 } from '@/lib/db2'
import type { Curso, Leccion, Diapositiva, CursoLeccion, LeccionDiapositiva } from '@prisma/client-db2'

export type TipoUsuario = 'publico' | 'free' | 'premium'

export interface CursoConLecciones extends Curso {
  cursoLecciones: (CursoLeccion & {
    leccion: Leccion
  })[]
}

export interface LeccionConDiapositivas extends Leccion {
  leccionDiapositivas: (LeccionDiapositiva & {
    diapositiva: Diapositiva
  })[]
}

export interface CursoDetallado extends Curso {
  cursoLecciones: (CursoLeccion & {
    leccion: Leccion
  })[]
}

export class ContenidoService {
  
  /**
   * Construye la cláusula WHERE según el tipo de usuario
   */
  private buildWhereClause(tipoUsuario: TipoUsuario) {
    switch (tipoUsuario) {
      case 'publico':
        return {
          estado: 'activo',
          contenido_publico: {
            not: null
          }
        }
      case 'free':
        return {
          estado: 'activo',
          OR: [
            { contenido_publico: { not: null } },
            // Aquí se pueden agregar criterios específicos para contenido FREE
            // Por ejemplo: tags que contengan 'free', categorías específicas, etc.
          ]
        }
      case 'premium':
        return {
          estado: 'activo'
          // Sin restricciones adicionales para usuarios premium
        }
      default:
        return {
          estado: 'activo',
          contenido_publico: { not: null }
        }
    }
  }

  /**
   * Construye la cláusula de inclusión según el tipo de usuario
   */
  private getIncludeClause(tipoUsuario: TipoUsuario, incluirRelaciones = false) {
    const baseInclude = {
      cursoLecciones: incluirRelaciones ? {
        orderBy: { indice: 'asc' as const },
        include: {
          leccion: {
            where: this.buildLeccionWhereClause(tipoUsuario)
          }
        }
      } : false
    }

    return baseInclude
  }

  /**
   * Construye la cláusula WHERE para lecciones según el tipo de usuario
   */
  private buildLeccionWhereClause(tipoUsuario: TipoUsuario) {
    switch (tipoUsuario) {
      case 'publico':
        return {
          estado: 'activo',
          contenido_publico: { not: null }
        }
      case 'free':
        return {
          estado: 'activo',
          OR: [
            { contenido_publico: { not: null } }
            // Criterios específicos para contenido FREE
          ]
        }
      case 'premium':
        return {
          estado: 'activo'
        }
      default:
        return {
          estado: 'activo',
          contenido_publico: { not: null }
        }
    }
  }

  /**
   * Obtiene todos los cursos según el tipo de usuario
   */
  async getCursos(tipoUsuario: TipoUsuario): Promise<Curso[]> {
    const whereClause = this.buildWhereClause(tipoUsuario)
    
    return await db2.curso.findMany({
      where: whereClause,
      orderBy: [
        { fecha_creacion: 'desc' }
      ]
    })
  }


  /**
   * Obtiene un curso por su ID
   */
  async getCursoById(id: number, tipoUsuario: TipoUsuario): Promise<CursoConLecciones | null> {
    const whereClause = this.buildWhereClause(tipoUsuario)
    
    return await db2.curso.findUnique({
      where: { 
        id,
        ...whereClause
      },
      include: {
        cursoLecciones: {
          orderBy: { indice: 'asc' },
          include: {
            leccion: true
          }
        }
      }
    }) as CursoConLecciones | null
  }

  /**
   * Obtiene las lecciones de un curso ordenadas
   */
  async getLeccionesPorCurso(cursoId: number, tipoUsuario: TipoUsuario): Promise<(CursoLeccion & { leccion: Leccion })[]> {
    return await db2.cursoLeccion.findMany({
      where: { 
        curso_id: cursoId,
        leccion: this.buildLeccionWhereClause(tipoUsuario)
      },
      include: {
        leccion: true
      },
      orderBy: { indice: 'asc' }
    })
  }

  /**
   * Obtiene una lección por su slug
   */
  async getLeccionBySlug(slug: string, tipoUsuario: TipoUsuario): Promise<LeccionConDiapositivas | null> {
    const whereClause = this.buildLeccionWhereClause(tipoUsuario)

    if (tipoUsuario === 'publico') {
      const leccion = await db2.leccion.findUnique({
        where: {
          slug,
          ...whereClause
        }
      })
      return leccion ? { ...leccion, leccionDiapositivas: [] } : null
    }

    return await db2.leccion.findUnique({
      where: {
        slug,
        ...whereClause
      },
      include: {
        leccionDiapositivas: {
          where: {
            diapositiva: {
              estado: 'activo'
            }
          },
          orderBy: { indice: 'asc' },
          include: {
            diapositiva: true
          }
        }
      }
    }) as LeccionConDiapositivas | null
  }

  /**
   * Obtiene las diapositivas de una lección (solo para usuarios autenticados)
   */
  async getDiapositivasPorLeccion(leccionId: number, tipoUsuario: TipoUsuario): Promise<(LeccionDiapositiva & { diapositiva: Diapositiva })[]> {
    if (tipoUsuario === 'publico') {
      return [] // Sin acceso a diapositivas para usuarios públicos
    }

    return await db2.leccionDiapositiva.findMany({
      where: { 
        leccion_id: leccionId,
        diapositiva: {
          estado: 'activo'
        }
      },
      include: {
        diapositiva: true
      },
      orderBy: { indice: 'asc' }
    })
  }

  /**
   * Obtiene una diapositiva por su slug (solo usuarios autenticados)
   */
  async getDiapositivaBySlug(slug: string, tipoUsuario: TipoUsuario): Promise<Diapositiva | null> {
    if (tipoUsuario === 'publico') {
      return null
    }

    return await db2.diapositiva.findUnique({
      where: {
        slug,
        estado: 'activo'
      }
    })
  }

  /**
   * Busca contenido por término de búsqueda
   */
  async buscarContenido(termino: string, tipoUsuario: TipoUsuario): Promise<{
    cursos: Curso[]
    lecciones: Leccion[]
    diapositivas: Diapositiva[]
  }> {
    const whereClauseCurso = this.buildWhereClause(tipoUsuario)
    const whereClauseLeccion = this.buildLeccionWhereClause(tipoUsuario)

    const [cursos, lecciones, diapositivas] = await Promise.all([
      db2.curso.findMany({
        where: {
          ...whereClauseCurso,
          OR: [
            { titulo: { contains: termino, mode: 'insensitive' as const } },
            { descripcion_corta: { contains: termino, mode: 'insensitive' as const } },
            { contenido_publico: { contains: termino, mode: 'insensitive' as const } },
            ...(tipoUsuario !== 'publico' ? [
              { contenido_privado: { contains: termino, mode: 'insensitive' as const } },
              { contenido: { contains: termino, mode: 'insensitive' as const } }
            ] : [])
          ]
        },
        take: 10
      }),

      db2.leccion.findMany({
        where: {
          ...whereClauseLeccion,
          OR: [
            { titulo: { contains: termino, mode: 'insensitive' as const } },
            { descripcion_corta: { contains: termino, mode: 'insensitive' as const } },
            { contenido_publico: { contains: termino, mode: 'insensitive' as const } },
            ...(tipoUsuario !== 'publico' ? [
              { contenido_privado: { contains: termino, mode: 'insensitive' as const } },
              { contenido: { contains: termino, mode: 'insensitive' as const } }
            ] : [])
          ]
        },
        take: 10
      }),

      tipoUsuario !== 'publico' ? db2.diapositiva.findMany({
        where: {
          estado: 'activo',
          OR: [
            { titulo: { contains: termino, mode: 'insensitive' as const } },
            { contenido: { contains: termino, mode: 'insensitive' as const } },
            { contenido_ai_text_dp: { contains: termino, mode: 'insensitive' as const } }
          ]
        },
        take: 10
      }) : []
    ])

    return {
      cursos,
      lecciones,
      diapositivas
    }
  }

  /**
   * Obtiene diapositivas con paginación y filtros
   */
  async getDiapositivasPaginadas(
    page: number = 1,
    limit: number = 12,
    tipoUsuario: TipoUsuario,
    filtros: {
      busqueda?: string
      ordenPor?: 'reciente' | 'antiguo' | 'titulo'
    } = {}
  ): Promise<{
    data: Diapositiva[]
    total: number
    totalPages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    if (tipoUsuario === 'publico') {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
        hasNext: false,
        hasPrev: false
      }
    }

    const offset = (page - 1) * limit

    // Construir filtros WHERE
    const whereClause: any = {
      estado: 'activo'
    }

    // Agregar búsqueda si existe
    if (filtros.busqueda && filtros.busqueda.trim()) {
      whereClause.OR = [
        { titulo: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { contenido: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { meta_description: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } }
      ]
    }

    // Construir ordenamiento
    let orderBy: any = [{ fecha_creacion: 'desc' }]
    
    switch (filtros.ordenPor) {
      case 'antiguo':
        orderBy = [{ fecha_creacion: 'asc' }]
        break
      case 'titulo':
        orderBy = [{ titulo: 'asc' }]
        break
      case 'reciente':
      default:
        orderBy = [{ fecha_creacion: 'desc' }]
        break
    }

    const [diapositivas, total] = await Promise.all([
      db2.diapositiva.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit
      }),
      db2.diapositiva.count({
        where: whereClause
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: diapositivas,
      total,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  /**
   * Obtiene estadísticas del contenido
   */
  async getEstadisticas(tipoUsuario: TipoUsuario): Promise<{
    totalCursos: number
    totalLecciones: number
    totalDiapositivas: number
  }> {
    const whereClauseCurso = this.buildWhereClause(tipoUsuario)
    const whereClauseLeccion = this.buildLeccionWhereClause(tipoUsuario)

    const [totalCursos, totalLecciones, totalDiapositivas] = await Promise.all([
      db2.curso.count({ where: whereClauseCurso }),
      db2.leccion.count({ where: whereClauseLeccion }),
      tipoUsuario !== 'publico' ? db2.diapositiva.count({ where: { estado: 'activo' } }) : 0
    ])

    return {
      totalCursos,
      totalLecciones,
      totalDiapositivas
    }
  }

  /**
   * Obtiene el contenido adecuado según el tipo de usuario
   */
  getContenidoSegunTipo(item: Curso | Leccion, tipoUsuario: TipoUsuario): string {
    switch (tipoUsuario) {
      case 'publico':
        return item.contenido_publico || ''
      case 'free':
        return item.contenido_publico || item.contenido || ''
      case 'premium':
        return item.contenido || item.contenido_privado || item.contenido_publico || ''
      default:
        return item.contenido_publico || ''
    }
  }

  // ===================== MÉTODOS PARA CURSOS =====================

  /**
   * Construye la cláusula WHERE para cursos según el tipo de usuario y features
   */
  private buildCursoWhereClause(tipoUsuario: TipoUsuario, features?: string) {
    const baseClause = {
      estado: 'activo'
    }

    // Si no se especifica features, mostrar según tipo de usuario
    if (!features) {
      return baseClause
    }

    return {
      ...baseClause,
      features
    }
  }

  /**
   * Determina qué contenido mostrar según usuario y features del curso
   */
  getContenidoCurso(curso: Curso, tipoUsuario: TipoUsuario): {
    contenido: string
    tieneAcceso: boolean
    mensaje?: string
  } {
    const features = curso.features || 'OPEN'

    // Usuario sin login (PÚBLICO)
    if (tipoUsuario === 'publico') {
      return {
        contenido: curso.contenido_publico || '',
        tieneAcceso: true,
        mensaje: 'Regístrate para ver más'
      }
    }

    // Usuario con login FREE (nunca ha pagado)
    if (tipoUsuario === 'free') {
      switch (features) {
        case 'OPEN':
        case 'FREE':
          return {
            contenido: curso.contenido_privado || '',
            tieneAcceso: true
          }
        case 'PREMIUM':
          return {
            contenido: curso.contenido_publico || '',
            tieneAcceso: false,
            mensaje: 'Actualiza a Premium para ver más'
          }
        default:
          return {
            contenido: curso.contenido_publico || '',
            tieneAcceso: false
          }
      }
    }

    // Usuario PREMIUM ACTIVO
    if (tipoUsuario === 'premium') {
      return {
        contenido: curso.contenido_privado || '',
        tieneAcceso: true
      }
    }

    // Fallback
    return {
      contenido: curso.contenido_publico || '',
      tieneAcceso: false
    }
  }

  /**
   * Obtiene cursos con paginación y filtros
   */
  async getCursosPaginados(
    page: number = 1,
    limit: number = 12,
    tipoUsuario: TipoUsuario,
    filtros: {
      busqueda?: string
      ordenPor?: 'reciente' | 'antiguo' | 'titulo'
      features?: string
    } = {}
  ): Promise<{
    data: Curso[]
    total: number
    totalPages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    const offset = (page - 1) * limit

    // Construir filtros WHERE
    const whereClause: any = this.buildCursoWhereClause(tipoUsuario, filtros.features)

    // Agregar búsqueda si existe
    if (filtros.busqueda && filtros.busqueda.trim()) {
      whereClause.OR = [
        { titulo: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { descripcion_corta: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { contenido_publico: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { meta_description: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } }
      ]
    }

    // Construir ordenamiento
    let orderBy: any = [{ fecha_creacion: 'desc' }]
    
    switch (filtros.ordenPor) {
      case 'antiguo':
        orderBy = [{ fecha_creacion: 'asc' }]
        break
      case 'titulo':
        orderBy = [{ titulo: 'asc' }]
        break
      case 'reciente':
      default:
        orderBy = [{ fecha_creacion: 'desc' }]
        break
    }

    const [cursos, total] = await Promise.all([
      db2.curso.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit
      }),
      db2.curso.count({
        where: whereClause
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: cursos,
      total,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  /**
   * Obtiene un curso por su slug
   */
  async getCursoBySlug(slug: string, tipoUsuario: TipoUsuario): Promise<Curso | null> {
    const whereClause = this.buildCursoWhereClause(tipoUsuario)
    
    return await db2.curso.findUnique({
      where: { 
        slug,
        ...whereClause
      }
    })
  }

  /**
   * Obtiene un curso por su slug - ACCESO ABIERTO (sin restricciones)
   */
  async getCursoBySlugAbierto(slug: string): Promise<Curso | null> {
    return await db2.curso.findUnique({
      where: { 
        slug,
        estado: 'activo'
      }
    })
  }

  /**
   * Obtiene las lecciones de un curso por su ID - ACCESO ABIERTO
   * Incluye el índice de ordenamiento desde la tabla de relación
   */
  async getLeccionesByCursoId(cursoId: number): Promise<Array<{
    id: number
    titulo: string
    descripcion_corta: string | null
    slug: string | null
    fecha_creacion: Date
    indice: number
  }>> {
    const result = await db2.cursoLeccion.findMany({
      where: {
        curso_id: cursoId,
        leccion: {
          estado: 'activo'
        }
      },
      include: {
        leccion: {
          select: {
            id: true,
            titulo: true,
            descripcion_corta: true,
            slug: true,
            fecha_creacion: true
          }
        }
      },
      orderBy: {
        indice: 'asc'
      }
    })

    return result.map(item => ({
      ...item.leccion,
      indice: item.indice
    }))
  }

  /**
   * Obtiene un curso detallado con lecciones por su ID
   */
  async getCursoDetalladoById(id: number, tipoUsuario: TipoUsuario): Promise<CursoDetallado | null> {
    const whereClause = this.buildCursoWhereClause(tipoUsuario)
    
    return await db2.curso.findUnique({
      where: { 
        id,
        ...whereClause
      },
      include: {
        cursoLecciones: {
          orderBy: { indice: 'asc' },
          include: {
            leccion: true
          }
        }
      }
    }) as CursoDetallado | null
  }

  /**
   * Busca cursos por término de búsqueda
   */
  async buscarCursos(termino: string, tipoUsuario: TipoUsuario): Promise<Curso[]> {
    const whereClause = this.buildCursoWhereClause(tipoUsuario)

    return await db2.curso.findMany({
      where: {
        ...whereClause,
        OR: [
          { titulo: { contains: termino, mode: 'insensitive' as const } },
          { descripcion_corta: { contains: termino, mode: 'insensitive' as const } },
          { contenido_publico: { contains: termino, mode: 'insensitive' as const } },
          { meta_description: { contains: termino, mode: 'insensitive' as const } }
        ]
      },
      take: 10,
      orderBy: [{ fecha_creacion: 'desc' }]
    })
  }

  /**
   * Obtiene estadísticas de cursos
   */
  async getEstadisticasCursos(tipoUsuario: TipoUsuario): Promise<{
    totalCursos: number
    cursosPorFeatures: { features: string, count: number }[]
  }> {
    const whereClause = this.buildCursoWhereClause(tipoUsuario)

    const [totalCursos, cursosPorFeatures] = await Promise.all([
      db2.curso.count({ where: whereClause }),
      db2.curso.groupBy({
        by: ['features'],
        where: whereClause,
        _count: { id: true }
      })
    ])

    return {
      totalCursos,
      cursosPorFeatures: cursosPorFeatures.map(item => ({
        features: item.features || 'OPEN',
        count: item._count.id
      }))
    }
  }

  // ===================== MÉTODOS PARA LECCIONES =====================

  /**
   * Construye la cláusula WHERE para lecciones según el tipo de usuario y features
   */
  private buildLeccionWhereClauseWithFeatures(tipoUsuario: TipoUsuario, features?: string) {
    const baseClause = {
      estado: 'activo'
    }

    // Si no se especifica features, mostrar según tipo de usuario
    if (!features) {
      return baseClause
    }

    return {
      ...baseClause,
      features
    }
  }

  /**
   * Determina qué contenido mostrar según usuario y features de la lección
   * Con manejo robusto de casos edge
   */
  getContenidoLeccion(leccion: Leccion, tipoUsuario: TipoUsuario): {
    contenido: string
    tieneAcceso: boolean
    mensaje?: string
  } {
    // Validar entrada
    if (!leccion) {
      console.error('getContenidoLeccion: leccion is null or undefined')
      return {
        contenido: '',
        tieneAcceso: false,
        mensaje: 'Error: Lección no encontrada'
      }
    }

    // Normalizar features con fallback robusto
    const features = ((leccion as any).features || 'OPEN').toUpperCase()
    const validFeatures = ['OPEN', 'FREE', 'PREMIUM']
    const normalizedFeatures = validFeatures.includes(features) ? features : 'OPEN'

    // Normalizar tipo de usuario
    const validTipos = ['publico', 'free', 'premium']
    const normalizedTipoUsuario = validTipos.includes(tipoUsuario) ? tipoUsuario : 'publico'

    // Usuario sin login (PÚBLICO)
    if (normalizedTipoUsuario === 'publico') {
      const contenidoPublico = leccion.contenido_publico || ''
      
      // Si no hay contenido público, mostrar mensaje de error
      if (!contenidoPublico.trim()) {
        return {
          contenido: '<p>Este contenido no está disponible temporalmente.</p>',
          tieneAcceso: false,
          mensaje: 'Regístrate para acceder a más contenido'
        }
      }

      return {
        contenido: contenidoPublico,
        tieneAcceso: true,
        mensaje: 'Regístrate para ver más'
      }
    }

    // Usuario con login FREE (nunca ha pagado)
    if (normalizedTipoUsuario === 'free') {
      switch (normalizedFeatures) {
        case 'OPEN':
        case 'FREE':
          const contenidoPrivado = leccion.contenido_privado || leccion.contenido_publico || ''
          
          if (!contenidoPrivado.trim()) {
            return {
              contenido: '<p>Este contenido no está disponible temporalmente.</p>',
              tieneAcceso: false,
              mensaje: 'Contenido en preparación'
            }
          }
          
          return {
            contenido: contenidoPrivado,
            tieneAcceso: true
          }
        case 'PREMIUM':
          return {
            contenido: leccion.contenido_publico || '<p>Contenido premium disponible con suscripción.</p>',
            tieneAcceso: false,
            mensaje: 'Actualiza a Premium para ver más'
          }
        default:
          console.warn(`getContenidoLeccion: features desconocido "${features}" para usuario free`)
          return {
            contenido: leccion.contenido_publico || '',
            tieneAcceso: false,
            mensaje: 'Tipo de contenido no reconocido'
          }
      }
    }

    // Usuario PREMIUM ACTIVO
    if (normalizedTipoUsuario === 'premium') {
      const contenidoCompleto = leccion.contenido_privado || leccion.contenido_publico || ''
      
      if (!contenidoCompleto.trim()) {
        return {
          contenido: '<p>Este contenido premium no está disponible temporalmente.</p>',
          tieneAcceso: true,
          mensaje: 'Contenido en preparación'
        }
      }
      
      return {
        contenido: contenidoCompleto,
        tieneAcceso: true
      }
    }

    // Fallback para tipos de usuario no reconocidos
    console.error(`getContenidoLeccion: tipoUsuario desconocido "${tipoUsuario}"`)
    return {
      contenido: leccion.contenido_publico || '<p>Error en la configuración del contenido.</p>',
      tieneAcceso: false,
      mensaje: 'Error de configuración. Contacta con soporte.'
    }
  }

  /**
   * Obtiene lecciones con paginación y filtros
   */
  async getLeccionesPaginados(
    page: number = 1,
    limit: number = 12,
    tipoUsuario: TipoUsuario,
    filtros: {
      busqueda?: string
      ordenPor?: 'reciente' | 'antiguo' | 'titulo'
      features?: string
    } = {}
  ): Promise<{
    data: Leccion[]
    total: number
    totalPages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    const offset = (page - 1) * limit

    // Construir filtros WHERE
    const whereClause: any = this.buildLeccionWhereClauseWithFeatures(tipoUsuario, filtros.features)

    // Agregar búsqueda si existe
    if (filtros.busqueda && filtros.busqueda.trim()) {
      whereClause.OR = [
        { titulo: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { descripcion_corta: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { contenido_publico: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } },
        { meta_description: { contains: filtros.busqueda.trim(), mode: 'insensitive' as const } }
      ]
    }

    // Construir ordenamiento
    let orderBy: any = [{ fecha_creacion: 'desc' }]
    
    switch (filtros.ordenPor) {
      case 'antiguo':
        orderBy = [{ fecha_creacion: 'asc' }]
        break
      case 'titulo':
        orderBy = [{ titulo: 'asc' }]
        break
      case 'reciente':
      default:
        orderBy = [{ fecha_creacion: 'desc' }]
        break
    }

    const [lecciones, total] = await Promise.all([
      db2.leccion.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit
      }),
      db2.leccion.count({
        where: whereClause
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: lecciones,
      total,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  /**
   * Obtiene una lección por su slug (actualizado para features)
   */
  async getLeccionBySlugWithFeatures(slug: string, tipoUsuario: TipoUsuario): Promise<Leccion | null> {
    const whereClause = this.buildLeccionWhereClauseWithFeatures(tipoUsuario)
    
    return await db2.leccion.findUnique({
      where: { 
        slug,
        ...whereClause
      }
    })
  }

  /**
   * Busca lecciones por término de búsqueda
   */
  async buscarLecciones(termino: string, tipoUsuario: TipoUsuario): Promise<Leccion[]> {
    const whereClause = this.buildLeccionWhereClauseWithFeatures(tipoUsuario)

    return await db2.leccion.findMany({
      where: {
        ...whereClause,
        OR: [
          { titulo: { contains: termino, mode: 'insensitive' as const } },
          { descripcion_corta: { contains: termino, mode: 'insensitive' as const } },
          { contenido_publico: { contains: termino, mode: 'insensitive' as const } },
          { meta_description: { contains: termino, mode: 'insensitive' as const } }
        ]
      },
      take: 10,
      orderBy: [{ fecha_creacion: 'desc' }]
    })
  }

  /**
   * Obtiene estadísticas de lecciones
   */
  async getEstadisticasLecciones(tipoUsuario: TipoUsuario): Promise<{
    totalLecciones: number
    leccionesPorFeatures: { features: string, count: number }[]
  }> {
    const whereClause = this.buildLeccionWhereClauseWithFeatures(tipoUsuario)

    const [totalLecciones, leccionesPorFeatures] = await Promise.all([
      db2.leccion.count({ where: whereClause }),
      // Temporalmente omitir groupBy hasta que el campo features esté disponible
      Promise.resolve([])
      /*
      db2.leccion.groupBy({
        by: ['features'],
        where: whereClause,
        _count: { id: true }
      })
      */
    ])

    return {
      totalLecciones,
      leccionesPorFeatures: leccionesPorFeatures.map(item => ({
        features: 'OPEN',
        count: 0
      }))
    }
  }
}

// Instancia singleton del servicio
export const contenidoService = new ContenidoService()