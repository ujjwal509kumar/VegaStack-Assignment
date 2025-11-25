import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, type } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token with Supabase Auth
    const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: type || 'magiclink',
    });

    if (verifyError || !data.user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Mark email as verified in our database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('email', data.user.email);

    if (error) throw error;

    return NextResponse.json({
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
