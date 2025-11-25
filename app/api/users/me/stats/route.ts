import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

async function getStatsHandler(req: AuthenticatedRequest) {
  try {
    const stats = await db.stats.getUserStats(req.user!.userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = authenticate(getStatsHandler);
