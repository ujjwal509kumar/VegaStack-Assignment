import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { post_id: postId } = await params;

    // Get comments with user details
    const { data: commentsData, error } = await supabaseAdmin
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user:users!comments_user_id_fkey(
          username,
          first_name,
          last_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const comments = commentsData?.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        username: comment.user.username,
        first_name: comment.user.first_name,
        last_name: comment.user.last_name,
      },
    })) || [];

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
