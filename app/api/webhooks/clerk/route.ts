import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { 
  createUserProfile, 
  updateUserProfile, 
  handleUserDeletion,
  logSessionActivity 
} from '@/lib/services/userSyncService';

// === INICIO ENDPOINT WEBHOOKS CLERK ===
/**
 * Endpoint para recibir webhooks de Clerk
 * Procesa eventos de usuario y sesión
 * Incluye validación de firma y manejo de errores
 */

const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Global Prisma instance for webhooks
const prismaClient = new PrismaClient();
const prisma = prismaClient as any;

// Tipos de eventos que procesamos
type ClerkEvent = {
  type: string;
  data: any;
  object: string;
  timestamp: number;
};

// Función para validar la firma del webhook
function validateWebhookSignature(payload: string, headersList: any): boolean {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('❌ CLERK_WEBHOOK_SECRET no está configurado');
      return false;
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    const headerPayload = headersList.get('svix-id');
    const headerTimestamp = headersList.get('svix-timestamp');
    const headerSignature = headersList.get('svix-signature');

    if (!headerPayload || !headerTimestamp || !headerSignature) {
      console.error('❌ Headers de webhook faltantes');
      return false;
    }

    wh.verify(payload, {
      'svix-id': headerPayload,
      'svix-timestamp': headerTimestamp,
      'svix-signature': headerSignature,
    });

    return true;
  } catch (err) {
    console.error('❌ Error validando firma del webhook:', err);
    return false;
  }
}

// Función para procesar evento user.created
async function processUserCreated(data: any, clientIP: string) {
  if (DEBUG_MODE) {
    console.log('🆕 Usuario creado:', {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: data.created_at
    });
  }
  
  // Crear perfil de usuario en la base de datos
  const createResult = await createUserProfile(data, clientIP);
  if (!createResult.success) {
    console.error('❌ Error creando usuario:', createResult.error);
    throw new Error('Error creating user profile');
  }
  
  console.log('✅ Usuario creado exitosamente en BD:', createResult.userId);
}

// Función para procesar evento user.updated
async function processUserUpdated(data: any) {
  if (DEBUG_MODE) {
    console.log('📝 Usuario actualizado:', {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      updatedAt: data.updated_at
    });
  }
  
  // Actualizar perfil de usuario en la base de datos
  const updateResult = await updateUserProfile(data);
  if (!updateResult.success) {
    console.error('❌ Error actualizando usuario:', updateResult.error);
    throw new Error('Error updating user profile');
  }
  
  console.log('✅ Usuario actualizado exitosamente en BD:', updateResult.userId);
}

// Función para procesar evento user.deleted
async function processUserDeleted(data: any) {
  if (DEBUG_MODE) {
    console.log('🗑️ Usuario eliminado:', {
      id: data.id,
      deletedAt: new Date().toISOString()
    });
  }
  
  // Manejar eliminación de usuario con compliance GDPR
  const deleteResult = await handleUserDeletion(data.id);
  if (!deleteResult.success) {
    console.error('❌ Error marcando usuario para eliminación:', deleteResult.error);
    throw new Error('Error handling user deletion');
  }
  
  console.log('✅ Usuario marcado para eliminación (GDPR):', deleteResult.userId);
}

// Función para procesar evento session.created (login)
async function processSessionCreated(data: any, clientIP: string) {
  if (DEBUG_MODE) {
    console.log('🔐 Nueva sesión creada:', {
      sessionId: data.id,
      userId: data.user_id,
      createdAt: new Date(data.created_at * 1000).toISOString(),
      status: data.status
    });
  }
  
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Clerk Webhook';
    const requestIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || clientIP;
    
    await prisma.userActivityLog.create({
      data: {
        userId: data.user_id,
        clerkUserId: data.user_id,
        clerkSessionId: data.id,
        action: 'LOGIN',
        description: `User ${data.user_id} logged in`,
        ipAddress: requestIP || '127.0.0.1',
        userAgent: userAgent,
        metadata: {
          sessionData: {
            sessionId: data.id,
            status: data.status,
            createdAt: data.created_at,
            lastActiveAt: data.last_active_at
          },
          clerkEvent: 'session.created',
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Login registrado exitosamente:', data.user_id);
    
  } catch (error) {
    console.error('❌ Error registrando login:', error);
  }
}

// Función para procesar evento session.ended (logout)
async function processSessionEnded(data: any, clientIP: string) {
  if (DEBUG_MODE) {
    console.log('🚪 Sesión terminada:', {
      sessionId: data.id,
      userId: data.user_id,
      endedAt: new Date().toISOString(),
      status: data.status
    });
  }
  
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Clerk Webhook';
    const requestIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || clientIP;
    
    await prisma.userActivityLog.create({
      data: {
        userId: data.user_id,
        clerkUserId: data.user_id,
        clerkSessionId: data.id,
        action: 'LOGOUT',
        description: `User ${data.user_id} logged out`,
        ipAddress: requestIP || '127.0.0.1',
        userAgent: userAgent,
        metadata: {
          sessionData: {
            sessionId: data.id,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastActiveAt: data.last_active_at
          },
          clerkEvent: 'session.ended/removed',
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Logout registrado exitosamente:', data.user_id);
    
  } catch (error) {
    console.error('❌ Error registrando logout:', error);
  }
}

// Función principal para procesar eventos
async function processClerkEvent(event: ClerkEvent, clientIP: string) {
  try {
    switch (event.type) {
      case 'user.created':
        await processUserCreated(event.data, clientIP);
        break;
      case 'user.updated':
        await processUserUpdated(event.data);
        break;
      case 'user.deleted':
        await processUserDeleted(event.data);
        break;
      case 'session.created':
        await processSessionCreated(event.data, clientIP);
        break;
      case 'session.ended':
      case 'session.removed':
        await processSessionEnded(event.data, clientIP);
        break;
      default:
        if (DEBUG_MODE) {
          console.log('⚠️ Evento no procesado:', event.type);
        }
    }
  } catch (error) {
    console.error('❌ Error procesando evento:', error);
    throw error;
  }
}

// Handler principal del endpoint POST
export async function POST(req: NextRequest) {
  try {
    // Rate limiting básico (TODO: implementar más robusto)
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const clientIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    if (!userAgent.includes('Svix-Webhooks')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener el payload
    const payload = await req.text();
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Payload vacío' },
        { status: 400 }
      );
    }

    // TEMPORAL: Desactivar validación de firma para testing
    // TODO: Reactivar después de configurar correctamente el webhook secret en Clerk Dashboard
    if (process.env.NODE_ENV === 'production') {
      // Validar firma del webhook solo en producción
      if (!validateWebhookSignature(payload, headersList)) {
        return NextResponse.json(
          { error: 'Firma inválida' },
          { status: 401 }
        );
      }
    } else {
      console.log('⚠️ DESARROLLO: Validación de firma desactivada temporalmente');
    }

    // Parsear el evento
    const event: ClerkEvent = JSON.parse(payload);
    
    if (DEBUG_MODE) {
      console.log('📨 Webhook recibido:', {
        type: event.type,
        timestamp: new Date(event.timestamp * 1000).toISOString()
      });
    }

    // Procesar el evento
    await processClerkEvent(event, clientIP);

    // Respuesta exitosa
    return NextResponse.json(
      { 
        success: true, 
        message: `Evento ${event.type} procesado correctamente`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en webhook endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: DEBUG_MODE ? String(error) : 'Error procesando webhook'
      },
      { status: 500 }
    );
  }
}

// Handler para métodos no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  );
}

// === FIN ENDPOINT WEBHOOKS CLERK ===