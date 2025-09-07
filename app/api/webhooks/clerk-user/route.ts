/**
 * Webhook para sincronizar eventos de usuario de Clerk con base de datos
 * POST /api/webhooks/clerk-user
 * 
 * Eventos soportados:
 * - user.created: Crear perfil en BD
 * - user.updated: Actualizar perfil en BD
 * - user.deleted: Marcar para eliminación (GDPR)
 */

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';
import type { WebhookEvent } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Obtener headers de webhook
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Verificar que los headers existen
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Obtener body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Crear instancia de Webhook con secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verificar webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('❌ Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Procesar evento
  const eventType = evt.type;
  console.log(`📝 Clerk webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
      default:
        console.log(`🤷‍♂️ Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({
      success: true,
      eventType,
      userId: evt.data.id,
    });

  } catch (error) {
    console.error(`❌ Error processing ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Failed to process webhook', eventType },
      { status: 500 }
    );
  }
}

/**
 * Maneja evento de usuario creado en Clerk
 */
async function handleUserCreated(evt: WebhookEvent) {
  const userData = evt.data as any; // Type assertion para acceder a propiedades de usuario
  const { id, email_addresses, first_name, last_name, phone_numbers, created_at, image_url } = userData;

  const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id);
  const primaryPhone = phone_numbers?.find((phone: any) => phone.id === userData.primary_phone_number_id);

  console.log(`👤 Creating user profile for: ${primaryEmail?.email_address}`);

  // Crear perfil de usuario en BD
  await prisma.userProfile.create({
    data: {
      clerkUserId: id,
      email: primaryEmail?.email_address || '',
      firstName: first_name || null,
      lastName: last_name || null,
      phoneNumber: primaryPhone?.phone_number || null,
      profileImageUrl: image_url || null,
      emailVerified: primaryEmail?.verification?.status === 'verified',
      phoneVerified: primaryPhone?.verification?.status === 'verified',
      isActive: true,
      gdprConsent: false, // Usuario debe aceptar explícitamente
      legalBasis: 'contract',
      retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 años
      clerkMetadata: evt.data as any,
      lastSyncAt: new Date(),
    },
  });

  // Registrar actividad
  await prisma.userActivityLog.create({
    data: {
      userId: id,
      clerkUserId: id,
      action: 'USER_REGISTERED',
      description: 'Usuario se registró en la plataforma',
      metadata: {
        email: primaryEmail?.email_address,
        registrationMethod: 'clerk',
        hasPhone: !!primaryPhone?.phone_number,
        emailVerified: primaryEmail?.verification?.status === 'verified',
        createdAt: created_at,
      },
      resourceType: 'user_profile',
      resourceId: id,
    },
  });

  console.log(`✅ User profile created successfully: ${id}`);
}

/**
 * Maneja evento de usuario actualizado en Clerk
 */
async function handleUserUpdated(evt: WebhookEvent) {
  const userData = evt.data as any; // Type assertion para acceder a propiedades de usuario
  const { id, email_addresses, first_name, last_name, phone_numbers, image_url } = userData;

  const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id);
  const primaryPhone = phone_numbers?.find((phone: any) => phone.id === userData.primary_phone_number_id);

  console.log(`🔄 Updating user profile for: ${primaryEmail?.email_address}`);

  // Actualizar perfil existente
  await prisma.userProfile.upsert({
    where: {
      clerkUserId: id,
    },
    update: {
      email: primaryEmail?.email_address || '',
      firstName: first_name || null,
      lastName: last_name || null,
      phoneNumber: primaryPhone?.phone_number || null,
      profileImageUrl: image_url || null,
      emailVerified: primaryEmail?.verification?.status === 'verified',
      phoneVerified: primaryPhone?.verification?.status === 'verified',
      clerkMetadata: evt.data as any,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      clerkUserId: id,
      email: primaryEmail?.email_address || '',
      firstName: first_name || null,
      lastName: last_name || null,
      phoneNumber: primaryPhone?.phone_number || null,
      profileImageUrl: image_url || null,
      emailVerified: primaryEmail?.verification?.status === 'verified',
      phoneVerified: primaryPhone?.verification?.status === 'verified',
      isActive: true,
      gdprConsent: false,
      legalBasis: 'contract',
      retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
      clerkMetadata: evt.data as any,
      lastSyncAt: new Date(),
    },
  });

  // Registrar actividad
  await prisma.userActivityLog.create({
    data: {
      userId: id,
      clerkUserId: id,
      action: 'USER_PROFILE_UPDATED',
      description: 'Perfil de usuario actualizado desde Clerk',
      metadata: {
        email: primaryEmail?.email_address,
        hasPhone: !!primaryPhone?.phone_number,
        emailVerified: primaryEmail?.verification?.status === 'verified',
        updatedFields: {
          firstName: first_name,
          lastName: last_name,
          phoneNumber: primaryPhone?.phone_number,
        },
      },
      resourceType: 'user_profile',
      resourceId: id,
    },
  });

  console.log(`✅ User profile updated successfully: ${id}`);
}

/**
 * Maneja evento de usuario eliminado en Clerk
 */
async function handleUserDeleted(evt: WebhookEvent) {
  const { id } = evt.data;

  console.log(`🗑️ Processing user deletion for: ${id}`);

  // Marcar para eliminación (no eliminar inmediatamente por GDPR)
  await prisma.userProfile.updateMany({
    where: {
      clerkUserId: id,
    },
    data: {
      deletionRequested: true,
      deletionRequestedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    },
  });

  // Registrar actividad
  await prisma.userActivityLog.create({
    data: {
      userId: id,
      clerkUserId: id,
      action: 'USER_DELETION_REQUESTED',
      description: 'Usuario eliminado de Clerk - marcado para eliminación',
      metadata: {
        deletionSource: 'clerk_webhook',
        deletionDate: new Date().toISOString(),
        gdprCompliance: true,
      },
      resourceType: 'user_profile',
      resourceId: id,
    },
  });

  console.log(`✅ User marked for deletion: ${id}`);
}