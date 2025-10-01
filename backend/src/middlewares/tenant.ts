import type { NextFunction, Request, Response } from 'express';
import type {} from '../types/express.js';
import { env } from '../config/env.js';

function fromHeader(req: Request): string | undefined {
  const value = req.headers[env.tenantHeader];
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return String(value);
}

function fromSubdomain(req: Request): string | undefined {
  const host = req.headers.host;
  if (!host) return undefined;
  const withoutPort = host.split(':')[0];
  if (!withoutPort.endsWith(env.baseDomain)) return undefined;
  const parts = withoutPort.replace(`.${env.baseDomain}`, '').split('.');
  const sub = parts[parts.length - 1];
  if (!sub || sub === 'www' || sub === env.baseDomain) return undefined;
  return sub;
}

function fromPath(req: Request): string | undefined {
  const url = req.originalUrl || req.url || '';
  const pathOnly = url.split('?')[0];
  const segments = pathOnly.split('/').filter(Boolean);
  const v1Index = segments.indexOf('v1');
  const tenantIndex = v1Index >= 0 ? v1Index + 1 : 0;
  return segments[tenantIndex];
}

export function resolveTenant(req: Request, _res: Response, next: NextFunction) {
  let tenantId: string | undefined;
  switch (env.tenantStrategy) {
    case 'header':
      tenantId = fromHeader(req);
      break;
    case 'subdomain':
      tenantId = fromSubdomain(req);
      break;
    case 'path':
      tenantId = fromPath(req);
      break;
    default:
      tenantId = undefined;
  }

  if (!tenantId) {
    return next(new Error('Tenant not resolved'));
  }

  (req as any).tenant = { id: tenantId };
  return next();
}

export function tenantFromParam(req: Request, _res: Response, next: NextFunction) {
  const paramTenantId = (req.params as any).tenantId;
  if (paramTenantId) {
    (req as any).tenant = { id: String(paramTenantId) };
  }
  return next();
}

export function tenantParamMatchesJwt(req: Request, res: Response, next: NextFunction) {
  const paramTenantId = (req.params as any).tenantId;
  const jwtTenantId = (req as any).auth?.tenantId;
  if (paramTenantId && jwtTenantId && paramTenantId !== jwtTenantId) {
    return res.status(403).json({ error: 'Tenant mismatch' });
  }
  return next();
}


