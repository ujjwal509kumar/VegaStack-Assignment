import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

async function updateProfileHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { bio, avatarUrl, website, location, visibility } = body;

    // Validate bio length
    if (bio && bio.length > 160) {
      return NextResponse.json(
        { error: 'Bio must be 160 characters or less' },
        { status: 400 }
      );
    }

    // Validate visibility
    if (visibility && !['PUBLIC', 'PRIVATE', 'FOLLOWERS_ONLY'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;
    if (visibility !== undefined) updateData.visibility = visibility;

    const profile = await db.profiles.update(req.user!.userId, updateData);

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = authenticate(updateProfileHandler);
export const PATCH = authenticate(updateProfileHandler);
