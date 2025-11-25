import { supabaseAdmin } from './supabase';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export async function uploadImage(
  file: File,
  bucket: 'avatars' | 'posts',
  userId: string
): Promise<{ url: string; error?: string }> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { url: '', error: 'File size must be less than 2MB' };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { url: '', error: 'Only JPEG and PNG images are allowed' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', error: 'Failed to upload image' };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: 'Failed to upload image' };
  }
}

export async function deleteImage(url: string, bucket: 'avatars' | 'posts'): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) return;

    const filePath = `${bucket}/${urlParts[1]}`;

    await supabaseAdmin.storage.from(bucket).remove([filePath]);
  } catch (error) {
    console.error('Delete image error:', error);
  }
}
