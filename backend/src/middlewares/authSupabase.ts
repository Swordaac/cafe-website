import type { NextFunction, Request, Response } from 'express';
import type {} from '../types/express.js';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';

const encoder = new TextEncoder();

export async function authSupabase(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.slice('Bearer '.length);
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('JWT Secret:', env.supabaseJwtSecret ? 'Set' : 'Missing');

    const { payload } = await jwtVerify(token, encoder.encode(env.supabaseJwtSecret));

    const userId = String(payload.sub || '');
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    (req as any).auth = {
      userId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      tenantId: typeof (payload as any).tenant_id === 'string' ? String((payload as any).tenant_id) : undefined,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}




