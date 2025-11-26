import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware';

async function listUsersHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Check if user is admin for full access
    const isAdmin = req.user!.role === 'ADMIN';
    const currentUserId = req.user!.userId;

    if (isAdmin) {
      // Admin can see all users
      const { users, total } = await db.admin.listUsers(page, limit);
      return NextResponse.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Regular users can search/discover users
      const { users, total } = await db.admin.listUsers(page, limit);
      
      // Filter users based on visibility
      const filteredUsers = await Promise.all(
        users.map(async (user: any) => {
          const visibility = user.profile?.visibility || 'PUBLIC';
          
          // Always show own profile
          if (user.id === currentUserId) {
            return {
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
              created_at: user.created_at,
              profile: user.profile ? {
                bio: user.profile.bio,
                avatar_url: user.profile.avatar_url,
                visibility: user.profile.visibility,
              } : undefined,
            };
          }
          
          // Hide private profiles
          if (visibility === 'PRIVATE') {
            return null;
          }
          
          // For followers_only, check if current user follows them
          if (visibility === 'FOLLOWERS_ONLY') {
            const isFollowing = await db.follows.isFollowing(currentUserId, user.id);
            if (!isFollowing) {
              return null;
            }
          }
          
          // Show public profiles and allowed followers_only profiles
          return {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            created_at: user.created_at,
            profile: user.profile ? {
              bio: user.profile.bio,
              avatar_url: user.profile.avatar_url,
              visibility: user.profile.visibility,
            } : undefined,
          };
        })
      );

      // Remove null entries (filtered out users)
      const publicUsers = filteredUsers.filter(u => u !== null);

      return NextResponse.json({
        users: publicUsers,
        pagination: {
          page,
          limit,
          total: publicUsers.length,
          totalPages: Math.ceil(publicUsers.length / limit),
        },
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = authenticate(listUsersHandler);
