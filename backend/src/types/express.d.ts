import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: { id: string };
    auth?: { userId: string; email?: string; role?: string };
    membership?: { role: 'admin' | 'editor' | 'viewer' } | null;
  }
}


