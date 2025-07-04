import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthTokenPayload } from '../../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  next();
};

export const isSupplier = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (req.user.role !== 'supplier') {
    res.status(403).json({
      success: false,
      error: 'Supplier access required'
    });
    return;
  }

  next();
};