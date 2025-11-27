import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const token = requestUrl.searchParams.get('token');
  
  // Get the base URL - use the request origin to ensure correct domain
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_link&message=Missing verification token', baseUrl)
    );
  }

  try {
    // Decode custom token (format: base64(userId:timestamp))
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, timestamp] = decoded.split(':');

    if (!userId || !timestamp) {
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=Invalid verification token', baseUrl)
      );
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=This link has expired. Please request a new one.', baseUrl)
      );
    }

    // Verify user exists and update email_verified status
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verified')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=User not found', baseUrl)
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.redirect(
        new URL('/login?verified=true&message=Email already verified! You can log in.', baseUrl)
      );
    }

    // Update email verification status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.redirect(
        new URL('/login?error=verification_failed&message=Failed to verify email', baseUrl)
      );
    }

    return NextResponse.redirect(
      new URL('/login?verified=true&message=Email verified successfully! You can now log in.', baseUrl)
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/login?error=verification_failed&message=${encodeURIComponent(err.message || 'Verification failed')}`, baseUrl)
    );
  }
}
