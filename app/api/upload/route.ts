import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

async function uploadHandler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!bucket || !['avatars', 'posts'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG images are allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename with public folder to match RLS policy
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${req.user!.userId}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`; // Use public folder to match RLS policy

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure we're using service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Storage configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data, error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json({ 
        error: 'Failed to upload image', 
        details: uploadError.message 
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      message: 'Image uploaded successfully',
      url: urlData.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = authenticate(uploadHandler);
