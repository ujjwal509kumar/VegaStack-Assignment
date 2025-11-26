import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Get the base URL from environment or request
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || origin;

  if (token_hash && type) {
    try {
      // Verify the token with Supabase
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error('Token verification error:', error);
        return NextResponse.redirect(
          `${baseUrl}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (data?.user) {
        // Handle different types of verification
        if (type === 'signup' || type === 'email') {
          // Email verification
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ email_verified: true })
            .eq('email', data.user.email);

          if (updateError) {
            console.error('Failed to update email verification status:', updateError);
          }

          console.log('Email verified successfully for:', data.user.email);

          return NextResponse.redirect(
            `${baseUrl}/login?verified=true&message=Email verified successfully! You can now log in.`
          );
        } else if (type === 'recovery') {
          // Password reset - redirect to reset password page with token
          return NextResponse.redirect(
            `${baseUrl}/auth/reset-password?token=${token_hash}&type=recovery&email=${encodeURIComponent(data.user.email || '')}`
          );
        }
      }
    } catch (err) {
      console.error('Callback error:', err);
      return NextResponse.redirect(
        `${baseUrl}/login?error=verification_failed`
      );
    }
  }

  // If no token, redirect to login
  return NextResponse.redirect(`${baseUrl}/login`);
}
