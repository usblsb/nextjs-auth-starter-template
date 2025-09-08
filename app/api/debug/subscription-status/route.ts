/**
 * API para debug de subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscriptionStatus } from '@/lib/services/billingService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_321Zm9dg4pVieWqNhcOi9lHoxKW'; // Default test user

    console.log(`🔧 [DEBUG API] Testing getUserSubscriptionStatus for: ${userId}`);
    
    const result = await getUserSubscriptionStatus(userId);
    
    console.log(`🔧 [DEBUG API] Result:`, result);
    
    return NextResponse.json({
      success: true,
      userId,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [DEBUG API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}