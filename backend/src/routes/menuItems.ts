import { Router } from 'express';
import { MenuItem } from '../models/MenuItem.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { resolveTenant } from '../middlewares/tenant.js';

export const router = Router();

// Apply auth and tenant resolution
router.use(authSupabase, resolveTenant);

// List menu items for current tenant
router.get('/', async (req, res) => {
  const tenantId = req.tenant!.id;
  const items = await MenuItem.find({ tenantId }).lean();
  res.json({ data: items });
});

// Create a menu item for current tenant
router.post('/', async (req, res) => {
  const tenantId = req.tenant!.id;
  const { name, description, priceCents, category, imageUrl } = req.body ?? {};
  const created = await MenuItem.create({ tenantId, name, description, priceCents, category, imageUrl });
  res.status(201).json({ data: created });
});

// Update a menu item (only within tenant)
router.patch('/:id', async (req, res) => {
  const tenantId = req.tenant!.id;
  const { id } = req.params;
  const update = req.body ?? {};
  const updated = await MenuItem.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

// Delete a menu item (only within tenant)
router.delete('/:id', async (req, res) => {
  const tenantId = req.tenant!.id;
  const { id } = req.params;
  const deleted = await MenuItem.findOneAndDelete({ _id: id, tenantId });
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});


