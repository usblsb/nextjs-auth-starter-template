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
}

// Instancia singleton del servicio
export const contenidoService = new ContenidoService()