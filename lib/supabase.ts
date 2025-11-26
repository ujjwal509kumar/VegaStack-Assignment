import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side only Supabase admin client (uses service role key)
// This should only be imported in server-side code (API routes, server components)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // Fallback to regular client if service key not available (client-side)

// Test connection on initialization (server-side only)
if (typeof window === 'undefined' && supabaseServiceKey) {
  supabaseAdmin
    .from('users')
    .select('id')
    .limit(1)
    .then(({ error }) => {
      if (error) {
        console.error('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connected successfully');
      }
    });

  // Test storage connection
  supabaseAdmin.storage
    .listBuckets()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Storage connection failed:', error.message);
      } else {
        const buckets = data?.map(b => b.name) || [];
        console.log('✅ Storage connected. Buckets:', buckets.join(', ') || 'none');
        
        // Check required buckets
        const hasAvatars = buckets.includes('avatars');
        const hasPosts = buckets.includes('posts');
        
        if (!hasAvatars || !hasPosts) {
          console.warn('⚠️  Missing storage buckets!');
          if (!hasAvatars) console.warn('   - Create "avatars" bucket (public)');
          if (!hasPosts) console.warn('   - Create "posts" bucket (public)');
        }
      }
    });
}
