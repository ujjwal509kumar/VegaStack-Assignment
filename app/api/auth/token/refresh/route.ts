import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateAccessToken, generateRefreshToken, getTokenExpiry } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify token
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if token exists and is not revoked
    const storedToken = await db.refreshTokens.findByToken(refreshToken);

    if (!storedToken || storedToken.is_revoked) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    if (new Date() > new Date(storedToken.expires_at)) {
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      );
    }

    const user = await db.users.findById(storedToken.user_id);

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Revoke old refresh token
    await db.refreshTokens.revokeById(storedToken.id);

    // Store new refresh token
    await db.refreshTokens.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: getTokenExpiry(process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'),
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
