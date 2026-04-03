import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

export function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
