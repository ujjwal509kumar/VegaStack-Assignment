import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

// Delete comment
async function deleteCommentHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ comment_id: string }> }
) {
  const { comment_id } = await params;
  try {
    await db.comments.delete(comment_id, req.user!.userId);

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = (req: NextRequest, context: any) => authenticate((r) => deleteCommentHandler(r, context))(req);
