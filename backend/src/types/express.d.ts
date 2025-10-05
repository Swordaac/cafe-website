import 'express';

declare global {
  namespace Express {
    interface Request {
      tenant?: { id: string };
      auth?: { userId: string; email?: string; role?: string; tenantId?: string };
      membership?: { role: 'admin' | 'editor' | 'viewer' } | null;
    }
  }
}


