import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

export const authenticate = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided', shouldLogout: true },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    // If token verification fails (tampered, expired, or invalid)
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or tampered token', shouldLogout: true },
        { status: 401 }
      );
    }
    
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = payload;
    
    return handler(authenticatedReq);
  };
};

export const requireAdmin = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return authenticate(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    return handler(req);
  });
};
