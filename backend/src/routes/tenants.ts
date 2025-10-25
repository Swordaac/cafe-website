import { Router } from 'express';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { Tenant } from '../models/Tenant.js';
import { Membership } from '../models/Membership.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';
import { env } from '../config/env.js';

export const router = Router();

// Provision a new tenant and assign current user as admin
router.post('/', authSupabase, async (req, res, next) => {
  try {
    const { name, id } = req.body ?? {};
    const tenantId: string = id || crypto.randomUUID();
    const userId = req.auth!.userId;

    const created = await Tenant.create({ _id: tenantId, name: name || tenantId });
    await Membership.create({ tenantId, userId, role: 'admin' });

    res.status(201).json({ data: created });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Tenant already exists' });
    }
    return next(error);
  }
});

// List tenants for current user
router.get('/mine', authSupabase, async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const memberships = await Membership.find({ userId }).lean();
    const tenantIds = memberships.map((m) => m.tenantId);
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).lean();
    res.json({ data: tenants });
  } catch (error) {
    return next(error);
  }
});

// List memberships for a specific tenant
router.get('/:tenantId/memberships', authSupabase, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const userId = req.auth!.userId;
    
    // Check if user has membership with this tenant
    const userMembership = await Membership.findOne({ tenantId, userId }).lean();
    if (!userMembership) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all memberships for this tenant
    const memberships = await Membership.find({ tenantId }).lean();
    res.json({ data: memberships });
  } catch (error) {
    return next(error);
  }
});


// Issue a short-lived tenant-bound token for dashboard/admin usage
// Requires the caller to be authenticated and a member (editor or admin) of the tenant
router.post('/:tenantId/token',
  authSupabase,
  tenantFromParam,
  ensureTenantExists,
  loadMembership,
  authorize(['editor', 'admin']),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenant!.id as string;
      const userId = (req as any).auth!.userId as string;
      const email = (req as any).auth!.email as string | undefined;
      const role = ((req as any).membership?.role ?? 'viewer') as 'viewer' | 'editor' | 'admin';

      const secret = new TextEncoder().encode(env.supabaseJwtSecret);

      // Short-lived token (e.g., 30 minutes) containing tenant_id claim
      const jwt = await new SignJWT({
        sub: userId,
        email,
        role,
        tenant_id: tenantId,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret);

      return res.status(201).json({ data: { token: jwt, tenantId } });
    } catch (error) {
      return next(error);
    }
  }
);


