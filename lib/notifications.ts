import { createClient } from '@supabase/supabase-js';

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  // Create client-side Supabase client for realtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log('🔌 Creating Supabase realtime connection...');
  console.log('📍 URL:', supabaseUrl);
  console.log('👤 User ID:', userId);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📨 Realtime event received:', payload);
        onNotification(payload.new as Notification);
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to notifications');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - check Supabase replication settings');
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Subscription timed out');
      }
    });

  return () => {
    console.log('🔌 Unsubscribing from notifications');
    supabase.removeChannel(channel);
  };
}
