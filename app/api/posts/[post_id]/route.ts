import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

// Get single post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const post = await db.posts.getById(post_id);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update post
async function updatePostHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    const body = await req.json();
    const { content, imageUrl, category } = body;

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
      }
      if (content.length > 280) {
        return NextResponse.json(
          { error: 'Content must be 280 characters or less' },
          { status: 400 }
        );
      }
    }

    if (category && !['GENERAL', 'ANNOUNCEMENT', 'QUESTION'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const post = await db.posts.update(post_id, req.user!.userId, {
      content,
      imageUrl,
      category,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete post
async function deletePostHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  try {
    await db.posts.delete(post_id, req.user!.userId);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = (req: NextRequest, context: any) => authenticate((r) => updatePostHandler(r, context))(req);
export const PATCH = (req: NextRequest, context: any) => authenticate((r) => updatePostHandler(r, context))(req);
export const DELETE = (req: NextRequest, context: any) => authenticate((r) => deletePostHandler(r, context))(req);
