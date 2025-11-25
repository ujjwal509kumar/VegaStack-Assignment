import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

// Follow user
async function followHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  try {
    const targetUserId = user_id;
    const currentUserId = req.user!.userId;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await db.users.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const isFollowing = await db.follows.isFollowing(currentUserId, targetUserId);
    if (isFollowing) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
    }

    await db.follows.follow(currentUserId, targetUserId);

    // Create notification for followed user
    await db.notifications.create({
      userId: targetUserId,
      type: 'FOLLOW',
      message: `Someone started following you`,
      relatedId: currentUserId,
    });

    return NextResponse.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Unfollow user
async function unfollowHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  try {
    const targetUserId = user_id;
    const currentUserId = req.user!.userId;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    await db.follows.unfollow(currentUserId, targetUserId);

    return NextResponse.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = (req: NextRequest, context: any) => authenticate((r) => followHandler(r, context))(req);
export const DELETE = (req: NextRequest, context: any) => authenticate((r) => unfollowHandler(r, context))(req);
