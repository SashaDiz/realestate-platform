import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';

export interface AuthRequest extends Request {
  admin?: IAdmin;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as { adminId: string };

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const generateToken = (adminId: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign({ adminId }, jwtSecret, { expiresIn: '7d' });
};

