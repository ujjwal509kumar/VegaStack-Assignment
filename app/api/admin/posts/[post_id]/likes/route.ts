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

    // Get likes with user details
    const { data: likesData, error } = await supabaseAdmin
      .from('likes')
      .select(`
        created_at,
        user:users!likes_user_id_fkey(
          username,
          first_name,
          last_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const likes = likesData?.map((like: any) => ({
      created_at: like.created_at,
      user: {
        username: like.user.username,
        first_name: like.user.first_name,
        last_name: like.user.last_name,
      },
    })) || [];

    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
