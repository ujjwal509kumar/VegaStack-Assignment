import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

async function markAsReadHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ notification_id: string }> }
) {
  const { notification_id } = await params;
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', req.user!.userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = (req: NextRequest, context: any) => authenticate((r) => markAsReadHandler(r, context))(req);
