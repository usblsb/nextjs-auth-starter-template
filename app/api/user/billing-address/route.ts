/**
 * API para gestionar direcciones de facturación del usuario
 * POST /api/user/billing-address - Guardar dirección
 * GET /api/user/billing-address - Obtener direcciones del usuario
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { BillingAddress } from '@/app/components/billing/BillingAddressForm';

const prisma = new PrismaClient();

// POST - Guardar dirección de facturación
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
    const { billingAddress, clerkUserId } = body;

    // 3. Validar datos requeridos
    if (!billingAddress || !clerkUserId) {
      return NextResponse.json(
        { error: 'Missing billing address data' },
        { status: 400 }
      );
    }

    // 4. Verificar que el userId coincida
    if (userId !== clerkUserId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    console.log(`🏠 Saving billing address for user ${clerkUserId}`);

    // 5. Crear dirección completa string para búsquedas
    const fullAddress = `${billingAddress.line1}${billingAddress.line2 ? ', ' + billingAddress.line2 : ''}, ${billingAddress.city}, ${billingAddress.postalCode}, ${billingAddress.country}`;

    // 6. Guardar dirección de facturación
    const savedAddress = await prisma.userBillingAddress.create({
      data: {
        userId: clerkUserId,
        country: billingAddress.country,
        state: billingAddress.state || null,
        city: billingAddress.city,
        postalCode: billingAddress.postalCode,
        addressLine1: billingAddress.line1,
        addressLine2: billingAddress.line2 || null,
        fullAddress: fullAddress,
      },
    });

    // 7. Registrar actividad
    await prisma.userActivityLog.create({
      data: {
        userId: clerkUserId,
        clerkUserId: clerkUserId,
        action: 'BILLING_ADDRESS_CREATED',
        description: 'Usuario añadió dirección de facturación',
        metadata: {
          addressId: savedAddress.id.toString(),
          country: billingAddress.country,
          postalCode: billingAddress.postalCode,
          city: billingAddress.city,
          createdAt: new Date().toISOString(),
        },
        resourceType: 'billing_address',
        resourceId: savedAddress.id.toString(),
      },
    });

    console.log(`✅ Billing address saved successfully: ${savedAddress.id}`);

    // 8. Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Billing address saved successfully',
      addressId: savedAddress.id.toString(),
      data: {
        id: savedAddress.id.toString(),
        country: savedAddress.country,
        state: savedAddress.state,
        city: savedAddress.city,
        postalCode: savedAddress.postalCode,
        addressLine1: savedAddress.addressLine1,
        addressLine2: savedAddress.addressLine2,
        createdAt: savedAddress.createdAt,
      },
    });

  } catch (error) {
    console.error('❌ Error saving billing address:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to save billing address'
      },
      { status: 500 }
    );
  }
}

// GET - Obtener direcciones de facturación del usuario
export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`📮 Getting billing addresses for user ${userId}`);

    // 2. Obtener direcciones del usuario
    const addresses = await prisma.userBillingAddress.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Transformar a formato del frontend
    const formattedAddresses = addresses.map(addr => ({
      id: addr.id,
      country: addr.country,
      state: addr.state,
      city: addr.city,
      postalCode: addr.postalCode,
      line1: addr.addressLine1,
      line2: addr.addressLine2,
      fullAddress: addr.fullAddress,
      createdAt: addr.createdAt,
    }));

    return NextResponse.json({
      success: true,
      addresses: formattedAddresses,
      count: addresses.length,
    });

  } catch (error) {
    console.error('❌ Error getting billing addresses:', error);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? String(error) 
          : 'Failed to get billing addresses'
      },
      { status: 500 }
    );
  }
}