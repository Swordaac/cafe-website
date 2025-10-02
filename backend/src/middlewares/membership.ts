import type { NextFunction, Request, Response } from 'express';
import { Tenant } from '../models/Tenant.js';
import { Membership } from '../models/Membership.js';

export async function ensureTenantExists(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.tenant?.id;
    console.log('Looking for tenant:', tenantId);
    if (!tenantId) return res.status(400).json({ error: 'Tenant not resolved' });
    const tenant = await Tenant.findById(tenantId).lean();
    console.log('Found tenant:', tenant);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function loadMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.auth?.userId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant not resolved' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const membership = await Membership.findOne({ tenantId, userId }).lean();
    (req as any).membership = membership || null;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireMembership(req: Request, res: Response, next: NextFunction) {
  const membership = (req as any).membership as { role: 'admin' | 'editor' | 'viewer' } | null | undefined;
  if (!membership) return res.status(403).json({ error: 'Membership required' });
  return next();
}


