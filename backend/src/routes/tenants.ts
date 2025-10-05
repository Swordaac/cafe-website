import { Router } from 'express';
import '../types/express.js';
import crypto from 'crypto';
import { Tenant } from '../models/Tenant.js';
import { Membership } from '../models/Membership.js';
import { authSupabase } from '../middlewares/authSupabase.js';

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


