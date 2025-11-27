import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.users.findByEmail(email);
    
    if (user) {
      // Generate custom reset token
      const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      
      // Send password reset email
      try {
        const emailTemplate = getPasswordResetEmailTemplate(user.first_name, resetLink);
        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
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
