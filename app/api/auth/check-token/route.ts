import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' });
    }

    // Check if token has already been used
    const { data: usedToken } = await supabaseAdmin
      .from('used_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    if (usedToken) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This reset link has already been used. Please request a new one.' 
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token check error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate token' });
  }
}
