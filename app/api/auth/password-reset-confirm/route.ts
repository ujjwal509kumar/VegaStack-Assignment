import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    console.log('Checking if token is already used:', token);
    const { data: usedToken, error: checkError } = await supabaseAdmin
      .from('used_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    console.log('Used token check result:', { usedToken, checkError });

    if (usedToken) {
      console.log('Token already used! Rejecting...');
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    console.log('Token is new, proceeding...');

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Verify the reset token with Supabase Auth
    const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (verifyError || !data.user) {
      const errorMessage = verifyError?.message || 'Invalid or expired reset token';
      return NextResponse.json(
        { error: errorMessage.includes('expired') ? 'This reset link has expired. Please request a new one.' : errorMessage },
        { status: 400 }
      );
    }

    // Mark token as used BEFORE updating password
    console.log('Marking token as used:', token, data.user.email);
    const { error: insertError } = await supabaseAdmin
      .from('used_tokens')
      .insert({
        token_hash: token,
        user_email: data.user.email,
      });

    if (insertError) {
      console.error('Failed to mark token as used:', insertError);
    } else {
      console.log('Token marked as used successfully');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in our database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', data.user.email);

    if (error) throw error;

    // Invalidate all existing sessions for this user in Supabase Auth
    try {
      await supabaseAdmin.auth.admin.signOut(data.user.id);
    } catch (signOutError) {
      console.error('Failed to sign out user sessions:', signOutError);
    }

    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
