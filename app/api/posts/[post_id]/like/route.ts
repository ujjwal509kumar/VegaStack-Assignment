import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

// Like post
async function likeHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const postId = post_id;
    const userId = req.user!.userId;

    // Check if post exists
    const post = await db.posts.getById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const isLiked = await db.likes.isLiked(userId, postId);
    if (isLiked) {
      return NextResponse.json({ error: 'Already liked this post' }, { status: 409 });
    }

    await db.likes.like(userId, postId);

    // Create notification for post author
    if (post.author_id !== userId) {
      await db.notifications.create({
        userId: post.author_id,
        type: 'LIKE',
        message: `Someone liked your post`,
        relatedId: postId,
      });
    }

    return NextResponse.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Unlike post
async function unlikeHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const postId = post_id;
    const userId = req.user!.userId;

    await db.likes.unlike(userId, postId);

    return NextResponse.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = (req: NextRequest, context: any) => authenticate((r) => likeHandler(r, context))(req);
export const DELETE = (req: NextRequest, context: any) => authenticate((r) => unlikeHandler(r, context))(req);
