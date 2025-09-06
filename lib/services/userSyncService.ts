import { PrismaClient } from '@prisma/client';

// === INICIO SERVICIO SINCRONIZACIÓN USUARIOS ===
/**
 * Servicio para sincronizar datos de usuarios entre Clerk y la base de datos local
 * Maneja compliance GDPR y auditoría de cambios
 */

const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Tipos para los eventos de Clerk
interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
  username: string | null;
  phone_numbers?: Array<{
    phone_number: string;
    id: string;
  }>;
  external_accounts?: Array<{
    provider: string;
    email_address: string;
  }>;
}

interface ClerkSessionData {
  id: string;
  user_id: string;
  status: string;
  created_at: number;
  updated_at: number;
  last_active_at: number;
}

// Función para validar datos de entrada
function validateUserData(data: ClerkUserData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.id) {
    errors.push('ID de usuario requerido');
  }
  
  if (!data.email_addresses || data.email_addresses.length === 0) {
    errors.push('Al menos un email es requerido');
  } else {
    const primaryEmail = data.email_addresses[0].email_address;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryEmail)) {
      errors.push('Email principal inválido');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Función para extraer IP del request (para auditoría)
function extractClientIP(headers: any): string {
  // En producción, esto vendría de headers como x-forwarded-for
  // Por ahora usamos un placeholder
  return headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || '127.0.0.1';
}

// === FUNCIÓN CREAR PERFIL DE USUARIO ===
/**
 * Crea un nuevo perfil de usuario en la base de datos
 * Incluye compliance GDPR automático
 */
export async function createUserProfile(
  userData: ClerkUserData, 
  clientIP?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validar datos de entrada
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      const errorMsg = `Datos inválidos: ${validation.errors.join(', ')}`;
      if (DEBUG_MODE) {
        console.error('❌ Error validación usuario:', errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    const primaryEmail = userData.email_addresses[0].email_address;
    const primaryPhone = userData.phone_numbers?.[0]?.phone_number || null;
    
    // Calcular fecha de retención GDPR (10 años desde registro)
    const gdprRetentionDate = new Date();
    gdprRetentionDate.setFullYear(gdprRetentionDate.getFullYear() + 10);
    
    // Crear perfil de usuario
    const userProfile = await prisma.UserProfile.create({
      data: {
        clerkUserId: userData.id,
        email: primaryEmail,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        phoneNumber: primaryPhone,
        profileImageUrl: userData.image_url,
        registrationIp: clientIP || '127.0.0.1',
        retentionUntil: gdprRetentionDate,
        isActive: true,
        deletionRequested: false,
        gdprConsent: true,
        gdprConsentDate: new Date(),
        legalBasis: 'contract',
        clerkMetadata: {
          clerkId: userData.id,
          externalAccounts: userData.external_accounts || [],
          createdAt: new Date(userData.created_at).toISOString(),
          updatedAt: new Date(userData.updated_at).toISOString()
        },
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
        lastSyncAt: new Date()
      }
    });

    if (DEBUG_MODE) {
      console.log('✅ Usuario creado exitosamente:', {
        id: userProfile.id,
        clerkUserId: userData.id,
        email: primaryEmail,
        gdprRetentionDate: gdprRetentionDate.toISOString()
      });
    }

    return { 
      success: true, 
      userId: userProfile.id 
    };

  } catch (error) {
    const errorMsg = `Error creando usuario: ${error}`;
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// === FUNCIÓN ACTUALIZAR PERFIL DE USUARIO ===
/**
 * Actualiza un perfil de usuario existente
 * Mantiene auditoría de cambios
 */
export async function updateUserProfile(
  userData: ClerkUserData
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validar datos de entrada
    const validation = validateUserData(userData);
    if (!validation.isValid) {
      const errorMsg = `Datos inválidos: ${validation.errors.join(', ')}`;
      if (DEBUG_MODE) {
        console.error('❌ Error validación actualización:', errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    // Buscar usuario existente
      const existingUser = await prisma.UserProfile.findUnique({
      where: { clerkUserId: userData.id }
    });

    if (!existingUser) {
      const errorMsg = `Usuario no encontrado: ${userData.id}`;
      if (DEBUG_MODE) {
        console.error('❌', errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    const primaryEmail = userData.email_addresses[0].email_address;
    const primaryPhone = userData.phone_numbers?.[0]?.phone_number || null;
    
    // Detectar cambios para auditoría
    const changes: string[] = [];
    if (existingUser.email !== primaryEmail) changes.push(`email: ${existingUser.email} → ${primaryEmail}`);
    if (existingUser.firstName !== userData.first_name) changes.push(`firstName: ${existingUser.firstName} → ${userData.first_name}`);
    if (existingUser.lastName !== userData.last_name) changes.push(`lastName: ${existingUser.lastName} → ${userData.last_name}`);
    if (existingUser.username !== userData.username) changes.push(`username: ${existingUser.username} → ${userData.username}`);
    if (existingUser.phoneNumber !== primaryPhone) changes.push(`phone: ${existingUser.phoneNumber} → ${primaryPhone}`);
    if (existingUser.profileImageUrl !== userData.image_url) changes.push(`avatar: ${existingUser.profileImageUrl} → ${userData.image_url}`);

    // Actualizar usuario
    const updatedUser = await prisma.UserProfile.update({
      where: { clerkUserId: userData.id },
      data: {
        email: primaryEmail,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        phoneNumber: primaryPhone,
        profileImageUrl: userData.image_url,
        lastSyncAt: new Date(),
        dataVersion: existingUser.dataVersion + 1,
        clerkMetadata: {
          clerkId: userData.id,
          externalAccounts: userData.external_accounts || [],
          createdAt: new Date(userData.created_at).toISOString(),
          updatedAt: new Date(userData.updated_at).toISOString()
        },
        updatedAt: new Date(userData.updated_at)
      }
    });

    if (DEBUG_MODE && changes.length > 0) {
      console.log('📝 Usuario actualizado:', {
        id: updatedUser.id,
        clerkUserId: userData.id,
        changes: changes
      });
    }

    return { 
      success: true, 
      userId: updatedUser.id 
    };

  } catch (error) {
    const errorMsg = `Error actualizando usuario: ${error}`;
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// === FUNCIÓN MANEJAR ELIMINACIÓN DE USUARIO ===
/**
 * Maneja la eliminación de usuario con compliance GDPR
 * No elimina físicamente, marca para eliminación
 */
export async function handleUserDeletion(
  clerkUserId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Buscar usuario existente
    const existingUser = await prisma.UserProfile.findUnique({
      where: { clerkUserId: clerkUserId }
    });

    if (!existingUser) {
      const errorMsg = `Usuario no encontrado para eliminación: ${clerkUserId}`;
      if (DEBUG_MODE) {
        console.error('❌', errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    // Marcar usuario como eliminado (eliminación lógica)
    const updatedUser = await prisma.UserProfile.update({
      where: { clerkUserId: clerkUserId },
      data: {
        isActive: false,
        deletionRequested: true,
        deletionRequestedAt: new Date(),
        lastSyncAt: new Date()
      }
    });

    if (DEBUG_MODE) {
      console.log('🗑️ Usuario marcado para eliminación:', {
        id: updatedUser.id,
        clerkUserId: clerkUserId,
        deletionRequestedAt: updatedUser.deletionRequestedAt?.toISOString(),
        gdprRetentionDate: updatedUser.gdprRetentionDate?.toISOString()
      });
    }

    return { 
      success: true, 
      userId: updatedUser.id 
    };

  } catch (error) {
    const errorMsg = `Error marcando usuario para eliminación: ${error}`;
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// === FUNCIÓN SINCRONIZAR USUARIOS EXISTENTES ===
/**
 * Función para migración inicial de usuarios existentes desde Clerk
 * Útil para sincronizar usuarios que ya existen antes de implementar webhooks
 */
export async function syncExistingUsers(
  clerkUsers: ClerkUserData[]
): Promise<{ success: boolean; synced: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    if (DEBUG_MODE) {
      console.log(`🔄 Iniciando sincronización de ${clerkUsers.length} usuarios existentes...`);
    }

    for (const userData of clerkUsers) {
      try {
        // Verificar si el usuario ya existe
     const existingUser = await prisma.UserProfile.findUnique({
          where: { clerkUserId: userData.id }
        });

        if (existingUser) {
          // Usuario existe, actualizar
          const result = await updateUserProfile(userData);
          if (result.success) {
            syncedCount++;
          } else {
            errors.push(`Error actualizando ${userData.id}: ${result.error}`);
          }
        } else {
          // Usuario no existe, crear
          const result = await createUserProfile(userData);
          if (result.success) {
            syncedCount++;
          } else {
            errors.push(`Error creando ${userData.id}: ${result.error}`);
          }
        }
      } catch (error) {
        errors.push(`Error procesando usuario ${userData.id}: ${error}`);
      }
    }

    if (DEBUG_MODE) {
      console.log(`✅ Sincronización completada: ${syncedCount}/${clerkUsers.length} usuarios sincronizados`);
      if (errors.length > 0) {
        console.log(`⚠️ Errores encontrados: ${errors.length}`);
      }
    }

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors
    };

  } catch (error) {
    const errorMsg = `Error en sincronización masiva: ${error}`;
    console.error('❌', errorMsg);
    return {
      success: false,
      synced: syncedCount,
      errors: [errorMsg, ...errors]
    };
  }
}

// === FUNCIÓN REGISTRAR ACTIVIDAD DE SESIÓN ===
/**
 * Registra actividad de sesión (login/logout)
 */
export async function logSessionActivity(
  sessionData: ClerkSessionData,
  eventType: 'login' | 'logout',
  clientIP?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar usuario
    const user = await prisma.UserProfile.findUnique({
      where: { clerkUserId: sessionData.user_id }
    });

    if (!user) {
      const errorMsg = `Usuario no encontrado para sesión: ${sessionData.user_id}`;
      if (DEBUG_MODE) {
        console.error('❌', errorMsg);
      }
      return { success: false, error: errorMsg };
    }

    // Registrar actividad de sesión
    await prisma.userActivityLog.create({
      data: {
        userId: sessionData.user_id,
        action: eventType,
        sessionId: sessionData.id,
        ipAddress: clientIP || '127.0.0.1',
        metadata: {
          clerkSessionId: sessionData.id,
          sessionStatus: sessionData.status,
          lastActiveAt: new Date(sessionData.last_active_at).toISOString()
        }
      }
    });

    if (DEBUG_MODE) {
      console.log(`🔐 Actividad de sesión registrada:`, {
        userId: user.id,
        eventType,
        sessionId: sessionData.id,
        timestamp: new Date(sessionData.created_at).toISOString()
      });
    }

    return { success: true };

  } catch (error) {
    const errorMsg = `Error registrando actividad de sesión: ${error}`;
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// === FUNCIÓN LIMPIAR DATOS GDPR ===
/**
 * Función para limpiar datos que han superado el período de retención GDPR
 * Debe ejecutarse periódicamente (ej: cron job)
 */
export async function cleanupGDPRData(): Promise<{ success: boolean; cleaned: number; error?: string }> {
  try {
    const now = new Date();
    
    // Buscar usuarios con datos expirados
    const expiredUsers = await prisma.UserProfile.findMany({
      where: {
        retentionUntil: {
          lt: new Date()
        },
        deletionRequested: false
      }
    });

    let cleanedCount = 0;

    for (const user of expiredUsers) {
      await prisma.UserProfile.update({
        where: { id: user.id },
        data: {
          // Anonimizar datos personales
          email: `deleted_${user.id}@anonymized.local`,
          firstName: null,
          lastName: null,
          phoneNumber: null,
          profileImageUrl: null,
          username: null,
          // Marcar como procesado
          deletionRequested: true,
          deletionRequestedAt: new Date(),
          clerkMetadata: null,
          preferences: null
        }
      });
      cleanedCount++;
    }

    if (DEBUG_MODE && cleanedCount > 0) {
      console.log(`🧹 Limpieza GDPR completada: ${cleanedCount} usuarios anonimizados`);
    }

    return {
      success: true,
      cleaned: cleanedCount
    };

  } catch (error) {
    const errorMsg = `Error en limpieza GDPR: ${error}`;
    console.error('❌', errorMsg);
    return {
      success: false,
      cleaned: 0,
      error: errorMsg
    };
  }
}

// === FIN SERVICIO SINCRONIZACIÓN USUARIOS ===