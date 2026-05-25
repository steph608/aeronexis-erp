import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Ajouter l'utilisateur connecté dans la requête
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ================================
// VÉRIFIER LE TOKEN JWT
// ================================
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Récupérer le token dans le header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé — token manquant',
    });
  }

  // Extraire le token
  const token = authHeader.split(' ')[1];

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // Ajouter l'utilisateur dans la requête
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }
};

// ================================
// VÉRIFIER LE RÔLE
// ================================
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé — permissions insuffisantes',
      });
    }

    next();
  };
};