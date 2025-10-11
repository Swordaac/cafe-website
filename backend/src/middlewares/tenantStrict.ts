import type { NextFunction, Request, Response } from 'express';

export function resolveTenantStrict(req: Request, res: Response, next: NextFunction) {
  const jwtTenantId = (req as any).auth?.tenantId as string | undefined;
  const paramTenantId = (req.params as any)?.tenantId as string | undefined;

  if (!jwtTenantId) return res.status(401).json({ error: 'Unauthorized' });

  if (paramTenantId && paramTenantId !== jwtTenantId) {
    return res.status(403).json({ error: 'Tenant mismatch' });
  }

  (req as any).tenant = { id: jwtTenantId };
  return next();
}


