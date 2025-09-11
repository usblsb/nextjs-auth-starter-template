import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { TipoUsuario } from './contenidoService'

export class UserTypeService {
  
  /**
   * Determina el tipo de usuario basado en su autenticación y suscripción
   */
  async getTipoUsuario(userId?: string | null): Promise<TipoUsuario> {
    // Si no hay userId, es usuario público
    if (!userId) {
      return 'publico'
    }

    try {
      // Buscar el perfil del usuario y su suscripción activa
      const userProfile = await db.userProfile.findUnique({
        where: { clerkUserId: userId },
        include: {
          subscriptions: {
            where: {
              status: {
                in: ['active', 'trialing'] // Estados que consideramos como activos
              }
            },
            orderBy: {
              currentPeriodEnd: 'desc'
            },
            take: 1
          }
        }
      })

      // Si no existe el perfil, es usuario público
      if (!userProfile) {
        return 'publico'
      }

      // Si tiene suscripción activa, es premium
      if (userProfile.subscriptions.length > 0) {
        const activeSub = userProfile.subscriptions[0]
        
        // Verificar que la suscripción no haya expirado
        if (activeSub.currentPeriodEnd > new Date()) {
          return 'premium'
        }
      }

      // Si está autenticado pero sin suscripción activa, es free
      return 'free'
      
    } catch (error) {
      console.error('Error al determinar tipo de usuario:', error)
      // En caso de error, devolver el más restrictivo
      return 'publico'
    }
  }

  /**
   * Obtiene el tipo de usuario para el usuario actualmente autenticado
   */
  async getTipoUsuarioActual(): Promise<TipoUsuario> {
    const { userId } = await auth()
    return this.getTipoUsuario(userId)
  }

  /**
   * Verifica si el usuario tiene acceso a contenido premium
   */
  async tieneAccesoPremium(userId?: string | null): Promise<boolean> {
    const tipoUsuario = await this.getTipoUsuario(userId)
    return tipoUsuario === 'premium'
  }

  /**
   * Verifica si el usuario está autenticado (free o premium)
   */
  async estaAutenticado(userId?: string | null): Promise<boolean> {
    const tipoUsuario = await this.getTipoUsuario(userId)
    return tipoUsuario !== 'publico'
  }

  /**
   * Obtiene información detallada del usuario y su suscripción
   */
  async getDetallesUsuario(userId: string) {
    try {
      const userProfile = await db.userProfile.findUnique({
        where: { clerkUserId: userId },
        include: {
          subscriptions: {
            where: {
              status: {
                in: ['active', 'trialing', 'past_due', 'canceled']
              }
            },
            include: {
              billingPlan: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          permissions: true
        }
      })

      if (!userProfile) {
        return null
      }

      const tipoUsuario = await this.getTipoUsuario(userId)
      const subscripcionActiva = userProfile.subscriptions.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      )

      return {
        perfil: userProfile,
        tipoUsuario,
        subscripcionActiva,
        todasLasSubscripciones: userProfile.subscriptions,
        permisos: userProfile.permissions
      }
      
    } catch (error) {
      console.error('Error al obtener detalles del usuario:', error)
      return null
    }
  }

  /**
   * Verifica si un usuario puede acceder a una funcionalidad específica
   */
  async puedeAcceder(userId: string | null, funcionalidad: string): Promise<boolean> {
    if (!userId) return false

    const tipoUsuario = await this.getTipoUsuario(userId)

    // Definir reglas de acceso por funcionalidad
    const reglasAcceso: Record<string, TipoUsuario[]> = {
      'ver_diapositivas': ['free', 'premium'],
      'descargar_contenido': ['premium'],
      'acceso_multimedia': ['premium'],
      'contenido_ai': ['premium'],
      'exportar_notas': ['free', 'premium'],
      'progreso_avanzado': ['premium']
    }

    const tiposPermitidos = reglasAcceso[funcionalidad] || []
    return tiposPermitidos.includes(tipoUsuario)
  }
}

// Instancia singleton del servicio
export const userTypeService = new UserTypeService()