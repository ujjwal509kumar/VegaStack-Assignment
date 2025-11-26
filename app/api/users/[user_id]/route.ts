import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  try {
    const userId = user_id;

    const user = await db.users.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = await db.profiles.getByUserId(userId);
    
    // Get current user from token (if exists)
    const authHeader = req.headers.get('authorization');
    let currentUserId: string | null = null;
    let isAdmin = false;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          currentUserId = decoded.userId;
          isAdmin = decoded.role === 'ADMIN';
        }
      } catch (err) {
        // Token invalid, continue as guest
      }
    }

    // Check visibility
    const visibility = profile?.visibility || 'PUBLIC';
    
    // Admin can see everything
    if (!isAdmin) {
      if (visibility === 'PRIVATE' && currentUserId !== userId) {
        return NextResponse.json({ error: 'This profile is private' }, { status: 403 });
      }
      
      if (visibility === 'FOLLOWERS_ONLY' && currentUserId !== userId) {
        // Check if current user follows this user
        if (!currentUserId) {
          return NextResponse.json({ error: 'This profile is only visible to followers' }, { status: 403 });
        }
        
        const isFollowing = await db.follows.isFollowing(currentUserId, userId);
        if (!isFollowing) {
          return NextResponse.json({ error: 'This profile is only visible to followers' }, { status: 403 });
        }
      }
    }

    const stats = await db.stats.getUserStats(userId);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
      profile,
      stats,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
