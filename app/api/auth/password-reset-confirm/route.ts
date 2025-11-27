import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';

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

    // Decode custom token (format: base64(userId:timestamp))
    let userId: string;
    let timestamp: string;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      [userId, timestamp] = decoded.split(':');

      if (!userId || !timestamp) {
        return NextResponse.json(
          { error: 'Invalid reset token' },
          { status: 400 }
        );
      }
    } catch (decodeError) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired (1 hour)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (tokenAge > maxAge) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    const { data: usedToken } = await supabaseAdmin
      .from('used_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    if (usedToken) {
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.users.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from('used_tokens')
      .insert({
        token_hash: token,
        user_email: user.email,
      });

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
