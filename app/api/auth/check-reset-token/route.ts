import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check if token has been used
    const { data: usedToken } = await supabaseAdmin
      .from('used_tokens')
      .select('*')
      .eq('token_hash', token)
      .single();

    if (usedToken) {
      return NextResponse.json({ used: true, error: 'Token already used' }, { status: 400 });
    }

    return NextResponse.json({ used: false, valid: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
