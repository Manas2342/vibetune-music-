import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    spotifyAccessToken: string;
    spotifyRefreshToken?: string;
    tokenExpiresAt?: number;
  };
}

// Simple in-memory session store (replace with Redis/database in production)
interface UserSession {
  id: string;
  spotifyAccessToken: string;
  spotifyRefreshToken?: string;
  tokenExpiresAt?: number;
  createdAt: number;
}

class AuthService {
  private sessions: Map<string, UserSession> = new Map();
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
    
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000);
  }

  // Create a new session
  createSession(spotifyAccessToken: string, spotifyRefreshToken?: string, expiresIn?: number): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    
    const session: UserSession = {
      id: sessionId,
      spotifyAccessToken,
      spotifyRefreshToken,
      tokenExpiresAt: expiresIn ? now + (expiresIn * 1000) : undefined,
      createdAt: now,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // Get session by ID
  getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Update session with new tokens
  updateSession(sessionId: string, spotifyAccessToken: string, spotifyRefreshToken?: string, expiresIn?: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.spotifyAccessToken = spotifyAccessToken;
    if (spotifyRefreshToken) {
      session.spotifyRefreshToken = spotifyRefreshToken;
    }
    if (expiresIn) {
      session.tokenExpiresAt = Date.now() + (expiresIn * 1000);
    }

    this.sessions.set(sessionId, session);
    return true;
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Clean expired sessions
  private cleanExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      // Remove sessions older than 30 days or with expired tokens
      if (
        now - session.createdAt > 30 * 24 * 60 * 60 * 1000 ||
        (session.tokenExpiresAt && now > session.tokenExpiresAt && !session.spotifyRefreshToken)
      ) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Check if token is expired
  isTokenExpired(session: UserSession): boolean {
    if (!session.tokenExpiresAt) {
      return false;
    }
    return Date.now() > session.tokenExpiresAt;
  }
}

export const authService = new AuthService();

// Middleware to authenticate requests
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const sessionId = authHeader.substring(7); // Remove 'Bearer ' prefix
    const session = authService.getSession(sessionId);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check if token is expired
    if (authService.isTokenExpired(session)) {
      return res.status(401).json({ error: 'Token expired', requiresRefresh: true });
    }

    req.user = {
      id: session.id,
      spotifyAccessToken: session.spotifyAccessToken,
      spotifyRefreshToken: session.spotifyRefreshToken,
      tokenExpiresAt: session.tokenExpiresAt,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional middleware - doesn't fail if no auth provided
export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const sessionId = authHeader.substring(7);
    const session = authService.getSession(sessionId);

    if (session && !authService.isTokenExpired(session)) {
      req.user = {
        id: session.id,
        spotifyAccessToken: session.spotifyAccessToken,
        spotifyRefreshToken: session.spotifyRefreshToken,
        tokenExpiresAt: session.tokenExpiresAt,
      };
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

export default authService;
