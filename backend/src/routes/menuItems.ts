import { Router } from 'express';
import { MenuItem } from '../models/MenuItem.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { resolveTenant } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership, requireMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';

export const router = Router();

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  res.status(200).end();
});

// Apply auth and tenant resolution (skip for OPTIONS requests)
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return authSupabase(req, res, next);
}, resolveTenant, ensureTenantExists, loadMembership);

// List menu items for current tenant
router.get('/', requireMembership, async (req, res) => {
  const tenantId = req.tenant!.id;
  const items = await MenuItem.find({ tenantId }).lean();
  res.json({ data: items });
});

// Create a menu item for current tenant
router.post('/', authorize(['editor', 'admin']), async (req, res) => {
  const tenantId = req.tenant!.id;
  const { name, description, priceCents, category, imageUrl } = req.body ?? {};
  const created = await MenuItem.create({ tenantId, name, description, priceCents, category, imageUrl });
  res.status(201).json({ data: created });
});

// Update a menu item (only within tenant)
router.patch('/:id', authorize(['editor', 'admin']), async (req, res) => {
  const tenantId = req.tenant!.id;
  const { id } = req.params;
  const update = req.body ?? {};
  const updated = await MenuItem.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

// Delete a menu item (only within tenant)
router.delete('/:id', authorize('admin'), async (req, res) => {
  const tenantId = req.tenant!.id;
  const { id } = req.params;
  const deleted = await MenuItem.findOneAndDelete({ _id: id, tenantId });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});


