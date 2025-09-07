/**
 * API de gestión de permisos administrativos
 * GET /api/admin/permissions - Lista administradores
 * POST /api/admin/permissions - Otorgar/revocar permisos
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAdmin, 
  listActiveAdmins, 
  grantAdminAccess, 
  revokeAdminAccess,
  getAdminActivityLogs 
} from '@/lib/services/adminService';

export async function GET(req: NextRequest) {
  try {
    // Verificar permisos de admin
    const adminUserId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        const admins = await listActiveAdmins();
        return NextResponse.json({
          success: true,
          admins,
        });

      case 'logs':
        const limit = parseInt(searchParams.get('limit') || '50');
        const logs = await getAdminActivityLogs(adminUserId, limit);
        return NextResponse.json({
          success: true,
          logs,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in admin permissions GET:', error);
    
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('Acceso denegado') ? 403 : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar permisos de admin
    const adminUserId = await requireAdmin();

    const { action, targetUserId } = await req.json();

    if (!action || !targetUserId) {
      return NextResponse.json(
        { error: 'Se requieren action y targetUserId' },
        { status: 400 }
      );
    }

    let result = false;

    switch (action) {
      case 'grant':
        result = await grantAdminAccess(targetUserId, adminUserId);
        break;

      case 'revoke':
        result = await revokeAdminAccess(targetUserId, adminUserId);
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Use: grant o revoke' },
          { status: 400 }
        );
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: action === 'grant' 
          ? 'Permisos de administrador otorgados correctamente'
          : 'Permisos de administrador revocados correctamente',
        action,
        targetUserId,
        adminUserId,
      });
    } else {
      return NextResponse.json(
        { error: `Error al ${action === 'grant' ? 'otorgar' : 'revocar'} permisos` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in admin permissions POST:', error);
    
    const message = error instanceof Error ? error.message : 'Error interno';
    const status = message.includes('Acceso denegado') ? 403 : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}