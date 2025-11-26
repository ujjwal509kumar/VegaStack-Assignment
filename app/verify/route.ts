import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  
  // Get the base URL - use the request origin to ensure correct domain
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  if (!token || !type) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_link&message=Missing token or type', baseUrl)
    );
  }

  // Handle different verification types
  if (type === 'recovery') {
    // Password reset - just pass through to reset page
    // Token will be validated when user submits the form
    const resetUrl = new URL('/auth/reset-password', baseUrl);
    resetUrl.searchParams.set('token', token);
    resetUrl.searchParams.set('type', 'recovery');
    
    return NextResponse.redirect(resetUrl);
  } else if (type === 'signup' || type === 'email') {
    // Email verification - verify immediately
    try {
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (error) {
        const errorMessage = error.message.includes('expired') 
          ? 'This link has expired. Please request a new one.'
          : error.message;
        
        return NextResponse.redirect(
          new URL(`/login?error=verification_failed&message=${encodeURIComponent(errorMessage)}`, baseUrl)
        );
      }

      if (!data?.user) {
        return NextResponse.redirect(
          new URL('/login?error=verification_failed&message=Invalid verification token', baseUrl)
        );
      }

      // Update email verification status
      await supabaseAdmin
        .from('users')
        .update({ email_verified: true })
        .eq('email', data.user.email);

      return NextResponse.redirect(
        new URL('/login?verified=true&message=Email verified successfully! You can now log in.', baseUrl)
      );
    } catch (err: any) {
      console.error('Verification error:', err);
      return NextResponse.redirect(
        new URL(`/login?error=verification_failed&message=${encodeURIComponent(err.message || 'Verification failed')}`, baseUrl)
      );
    }
  }

  return NextResponse.redirect(new URL('/login', baseUrl));
}
