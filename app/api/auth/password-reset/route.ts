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
    const user = await db.users.findByEmailOrUsername(email);
    
    if (user) {
      // Generate password reset link and send email
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/auth/reset-password`,
          },
        });

        if (linkError) {
          console.error('Password reset link generation error:', linkError);
        } else if (linkData?.properties?.action_link) {
          const resetLink = linkData.properties.action_link;
          
          // Send password reset email
          const emailTemplate = getPasswordResetEmailTemplate(user.first_name, resetLink);
          await sendEmail({
            to: email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });
        }
      } catch (emailError) {
        console.error('Failed to generate password reset link:', emailError);
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
