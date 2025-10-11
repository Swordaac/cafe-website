import type { NextFunction, Request, Response } from 'express';

export function auditLog(req: Request, _res: Response, next: NextFunction) {
  const tenantId = (req as any).tenant?.id || null;
  const userId = (req as any).auth?.userId || null;
  const route = `${req.method} ${req.originalUrl}`;

  // Structured log
  console.info(JSON.stringify({
    level: 'info',
    event: 'api_request',
    tenantId,
    userId,
    route,
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
    time: new Date().toISOString(),
  }));

  return next();
}


