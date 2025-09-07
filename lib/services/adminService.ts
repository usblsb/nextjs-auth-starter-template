/**
 * Servicio de administración y control de roles
 * Gestiona permisos y acceso a funciones administrativas
 */

import { PrismaClient } from '@prisma/client';
import { auth, clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

/**
 * Verifica si un usuario tiene rol de administrador
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // 1. Verificar en Clerk si el usuario tiene rol de admin
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const clerkRoles = user.publicMetadata?.roles as string[] || [];
    
    if (clerkRoles.includes('admin') || clerkRoles.includes('administrator')) {
      return true;
    }

    // 2. Verificar en base de datos local
    const userProfile = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      include: {
        permissions: {
          where: { 
            type: 'admin',
            expiresAt: null // Solo permisos que no expiran
          }
        }
      }
    });

    const hasAdminPermission = userProfile?.permissions?.some(
      p => p.type === 'admin' && (p.value === 'full' || p.value === 'metrics')
    );

    return hasAdminPermission || false;

  } catch (error) {
    console.error('❌ Error verificando admin status:', error);
    return false;
  }
}

/**
 * Middleware para verificar acceso de administrador
 */
export async function requireAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  const isAdmin = await isUserAdmin(userId);
  
  if (!isAdmin) {
    throw new Error('Acceso denegado: Se requieren permisos de administrador');
  }

  return userId;
}

/**
 * Otorga permisos de administrador a un usuario
 */
export async function grantAdminAccess(targetUserId: string, adminUserId: string): Promise<boolean> {
  try {
    // Verificar que quien otorga el permiso sea admin
    const isRequestorAdmin = await isUserAdmin(adminUserId);
    
    if (!isRequestorAdmin) {
      throw new Error('Solo los administradores pueden otorgar permisos');
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.userProfile.findUnique({
      where: { clerkUserId: targetUserId }
    });

    if (!targetUser) {
      throw new Error('Usuario objetivo no encontrado');
    }

    // Crear permiso de administrador
    await prisma.userPermission.create({
      data: {
        userId: targetUser.clerkUserId,
        type: 'admin',
        value: 'metrics',
      }
    });

    // Log de la acción
    await prisma.userActivityLog.create({
      data: {
        userId: targetUser.clerkUserId,
        action: 'ADMIN_PERMISSION_GRANTED',
        resourceType: 'UserPermission',
        resourceId: `admin_metrics_${targetUser.clerkUserId}`,
        metadata: {
          grantedBy: adminUserId,
          permission: 'admin_metrics',
          timestamp: new Date().toISOString(),
        }
      }
    });

    return true;

  } catch (error) {
    console.error('❌ Error otorgando permisos de admin:', error);
    return false;
  }
}

/**
 * Revoca permisos de administrador de un usuario
 */
export async function revokeAdminAccess(targetUserId: string, adminUserId: string): Promise<boolean> {
  try {
    // Verificar que quien revoca el permiso sea admin
    const isRequestorAdmin = await isUserAdmin(adminUserId);
    
    if (!isRequestorAdmin) {
      throw new Error('Solo los administradores pueden revocar permisos');
    }

    const targetUser = await prisma.userProfile.findUnique({
      where: { clerkUserId: targetUserId }
    });

    if (!targetUser) {
      throw new Error('Usuario objetivo no encontrado');
    }

    // Eliminar permisos de administrador
    await prisma.userPermission.deleteMany({
      where: {
        userId: targetUser.clerkUserId,
        type: 'admin'
      }
    });

    // Log de la acción
    await prisma.userActivityLog.create({
      data: {
        userId: targetUser.clerkUserId,
        action: 'ADMIN_PERMISSION_REVOKED',
        resourceType: 'UserPermission',
        resourceId: `admin_revoked_${targetUser.clerkUserId}`,
        metadata: {
          revokedBy: adminUserId,
          timestamp: new Date().toISOString(),
        }
      }
    });

    return true;

  } catch (error) {
    console.error('❌ Error revocando permisos de admin:', error);
    return false;
  }
}

/**
 * Lista todos los administradores activos
 */
export async function listActiveAdmins() {
  try {
    const admins = await prisma.userProfile.findMany({
      where: {
        permissions: {
          some: {
            type: 'admin',
            expiresAt: null
          }
        },
        isActive: true
      },
      include: {
        permissions: {
          where: {
            type: 'admin',
            expiresAt: null
          }
        }
      }
    });

    return admins.map(admin => ({
      userId: admin.clerkUserId,
      email: admin.email,
      name: admin.firstName && admin.lastName 
        ? `${admin.firstName} ${admin.lastName}` 
        : admin.email,
      permissions: admin.permissions.map(p => `${p.type}:${p.value}`),
      createdAt: admin.createdAt,
    }));

  } catch (error) {
    console.error('❌ Error listando administradores:', error);
    return [];
  }
}

/**
 * Logs de actividad administrativa
 */
export async function getAdminActivityLogs(adminUserId: string, limit: number = 50) {
  try {
    // Verificar que el solicitante sea admin
    const isAdmin = await isUserAdmin(adminUserId);
    
    if (!isAdmin) {
      throw new Error('Acceso denegado');
    }

    const logs = await prisma.userActivityLog.findMany({
      where: {
        action: {
          contains: 'ADMIN_'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        userProfile: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            clerkUserId: true,
          }
        }
      }
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      user: {
        email: log.userProfile?.email,
        name: log.userProfile?.firstName && log.userProfile?.lastName 
          ? `${log.userProfile.firstName} ${log.userProfile.lastName}` 
          : log.userProfile?.email,
        userId: log.userProfile?.clerkUserId,
      },
      resourceType: log.resourceType,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

  } catch (error) {
    console.error('❌ Error obteniendo logs de admin:', error);
    return [];
  }
}