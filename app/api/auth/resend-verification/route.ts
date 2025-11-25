import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.users.findByEmailOrUsername(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If the email exists, a verification link has been sent',
      });
    }

    if (user.email_verified) {
      return NextResponse.json({
        message: 'Email is already verified. You can login now.',
      });
    }

    // Send verification email using Supabase Auth
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          data: {
            user_id: user.id,
            username: user.username,
            action: 'verify_email',
          },
          redirectTo: `${process.env.APP_URL}/auth/verify?user_id=${user.id}`,
        },
      });

      if (authError) {
        console.error('Email sending error:', authError);
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
