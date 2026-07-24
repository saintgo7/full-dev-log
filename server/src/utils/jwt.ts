import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { JwtPayload } from '../types/index.js';
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue;
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function generateApiToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getRefreshTokenExpiry(): Date {
  const days = parseInt(REFRESH_EXPIRY.replace('d', ''), 10) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
