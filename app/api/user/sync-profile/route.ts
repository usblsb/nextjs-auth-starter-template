/**
 * API para sincronizar perfil de usuario con base de datos
 * POST /api/user/sync-profile
 * 
 * Sincroniza datos del perfil de Clerk con la tabla UserProfile
 * y registra la actividad en logs
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parsear datos del request
    const body = await req.json();
    const { userData, clerkUserId, email } = body;

    // 3. Validar datos requeridos
    if (!userData || !clerkUserId || !email) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // 4. Verificar que el userId coincida con el token
    if (userId !== clerkUserId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    console.log(`👤 Syncing profile for user ${clerkUserId}:`, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phoneNumber ? 'provided' : 'not provided',
    });

    // 5. Crear o actualizar perfil de usuario
    const userProfile = await prisma.userProfile.upsert({
      where: {
        clerkUserId: clerkUserId,
      },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
        // Actualizar metadata con consentimientos
        preferences: {
          marketingConsent: userData.marketingConsent,
          profileCompletedAt: new Date().toISOString(),
          termsAcceptedAt: userData.acceptTerms ? new Date().toISOString() : null,
        },
      },
      create: {
        clerkUserId: clerkUserId,
        email: email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        emailVerified: true, // Asumimos que Clerk ya verificó el email
        gdprConsent: userData.acceptTerms,
        gdprConsentDate: userData.acceptTerms ? new Date() : null,
        legalBasis: 'consent',
        retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 años
        preferences: {
          marketingConsent: userData.marketingConsent,
          profileCompletedAt: new Date().toISOString(),
          termsAcceptedAt: userData.acceptTerms ? new Date().toISOString() : null,
        },
        lastSyncAt: new Date(),
      },
    });

    // 6. Registrar actividad en logs
    await prisma.userActivityLog.create({
      data: {
        userId: clerkUserId,
        clerkUserId: clerkUserId,
        action: 'PROFILE_COMPLETED',
        description: 'Usuario completó su perfil con datos adicionales',
        metadata: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneProvided: !!userData.phoneNumber,
          marketingConsent: userData.marketingConsent,
          termsAccepted: userData.acceptTerms,
          syncedAt: new Date().toISOString(),
        },
        resourceType: 'user_profile',
        resourceId: userProfile.id.toString(),
      },
    });

    console.log(`✅ Profile synced successfully for user ${clerkUserId}`);

    // 7. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Profile synchronized successfully',
      profileId: userProfile.id,
      data: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber,
        syncedAt: userProfile.lastSyncAt,
      },
    });

  } catch (error) {
    console.error('❌ Error syncing user profile:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to sync profile'
      },
      { status: 500 }
    );
  }
}