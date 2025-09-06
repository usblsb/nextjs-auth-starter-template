import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

// === INICIO ENDPOINT WEBHOOKS CLERK ===
/**
 * Endpoint para recibir webhooks de Clerk
 * Procesa eventos de usuario y sesión
 * Incluye validación de firma y manejo de errores
 */

const DEBUG_MODE = process.env.NODE_ENV === 'development';

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
function processUserCreated(data: any) {
  if (DEBUG_MODE) {
    console.log('🆕 Usuario creado:', {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: data.created_at
    });
  }
  
  // TODO: Aquí se implementará la lógica para guardar el usuario en la base de datos
  // Por ahora solo logueamos el evento
}

// Función para procesar evento user.updated
function processUserUpdated(data: any) {
  if (DEBUG_MODE) {
    console.log('📝 Usuario actualizado:', {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      updatedAt: data.updated_at
    });
  }
  
  // TODO: Aquí se implementará la lógica para actualizar el usuario en la base de datos
}

// Función para procesar evento user.deleted
function processUserDeleted(data: any) {
  if (DEBUG_MODE) {
    console.log('🗑️ Usuario eliminado:', {
      id: data.id,
      deletedAt: new Date().toISOString()
    });
  }
  
  // TODO: Aquí se implementará la lógica para marcar el usuario como eliminado
}

// Función para procesar evento session.created (login)
function processSessionCreated(data: any) {
  if (DEBUG_MODE) {
    console.log('🔐 Sesión iniciada:', {
      sessionId: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
      status: data.status
    });
  }
  
  // TODO: Aquí se implementará la lógica para registrar el login
}

// Función para procesar evento session.ended (logout)
function processSessionEnded(data: any) {
  if (DEBUG_MODE) {
    console.log('🚪 Sesión terminada:', {
      sessionId: data.id,
      userId: data.user_id,
      endedAt: new Date().toISOString(),
      status: data.status
    });
  }
  
  // TODO: Aquí se implementará la lógica para registrar el logout
}

// Función principal para procesar eventos
function processClerkEvent(event: ClerkEvent) {
  try {
    switch (event.type) {
      case 'user.created':
        processUserCreated(event.data);
        break;
      case 'user.updated':
        processUserUpdated(event.data);
        break;
      case 'user.deleted':
        processUserDeleted(event.data);
        break;
      case 'session.created':
        processSessionCreated(event.data);
        break;
      case 'session.ended':
        processSessionEnded(event.data);
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

    // Validar firma del webhook
    if (!validateWebhookSignature(payload, headersList)) {
      return NextResponse.json(
        { error: 'Firma inválida' },
        { status: 401 }
      );
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
    processClerkEvent(event);

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