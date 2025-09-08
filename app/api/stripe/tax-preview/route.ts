import { NextRequest, NextResponse } from 'next/server';
import { determineTaxConfiguration } from '@/lib/services/taxService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');
    const postalCode = searchParams.get('postalCode');

    if (!country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }

    // Determinar configuración fiscal
    const taxInfo = determineTaxConfiguration({
      country,
      postalCode: postalCode || undefined,
    });

    return NextResponse.json({
      success: true,
      taxInfo: {
        country: taxInfo.country,
        postalCode: taxInfo.postalCode,
        isCanaryIslands: taxInfo.isCanaryIslands,
        region: taxInfo.region,
        description: taxInfo.taxConfig.description,
        rate: taxInfo.taxConfig.rate || 0,
        type: taxInfo.taxConfig.type,
      }
    });

  } catch (error) {
    console.error('❌ Error in tax preview:', error);
    return NextResponse.json(
      { error: 'Error calculating tax preview' },
      { status: 500 }
    );
  }
}