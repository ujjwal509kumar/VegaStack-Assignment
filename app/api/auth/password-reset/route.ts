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
    
    if (user) {
      // Send password reset email using Supabase Auth
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.APP_URL}/auth/reset-password`,
          },
        });

        if (authError) {
          console.error('Password reset email error:', authError);
        }
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Don't reveal if user exists or not for security
    return NextResponse.json({
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
