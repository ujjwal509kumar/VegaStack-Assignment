import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

// Get comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const { comments, total } = await db.comments.getPostComments(post_id, page, limit);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add comment
async function addCommentHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await db.posts.getById(post_id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = await db.comments.create({
      content,
      userId: req.user!.userId,
      postId: post_id,
    });

    // Create notification for post author
    if (post.author_id !== req.user!.userId) {
      // Get current user info for notification
      const currentUser = await db.users.findById(req.user!.userId);
      const userName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Someone';

      await db.notifications.create({
        userId: post.author_id,
        type: 'COMMENT',
        message: `${userName} commented on your post`,
        relatedId: post_id,
      });
    }

    return NextResponse.json(
      {
        message: 'Comment added successfully',
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = (req: NextRequest, context: any) => authenticate((r) => addCommentHandler(r, context))(req);
