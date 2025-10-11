import { Router } from 'express';
import type {} from '../types/express.js';
import { Category } from '../models/Category.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';
import { resolveTenantStrict } from '../middlewares/tenantStrict.js';

export const router = Router({ mergeParams: true });

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  res.status(200).end();
});

// For all routes, ensure tenant id from params exists
// Skip tenant validation for OPTIONS requests (CORS preflight)
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return tenantFromParam(req, res, next);
}, ensureTenantExists);

// Create category (Protected)
router.post('/', authSupabase, resolveTenantStrict, ensureTenantExists, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { name, sortOrder } = req.body ?? {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name is required' });
    if (sortOrder != null && typeof sortOrder !== 'number') return res.status(400).json({ error: 'sortOrder must be a number' });
    const created = await Category.create({ tenantId, name, sortOrder });
    res.status(201).json({ data: created });
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ error: 'Category already exists' });
    return next(error);
  }
});

// List categories (Public)
router.get('/', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const categories = await Category.find({ tenantId }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ data: categories });
  } catch (error) {
    return next(error);
  }
});

// Get single category by ID (Public)
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    
    const category = await Category.findOne({ _id: id, tenantId }).lean();
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ data: category });
  } catch (error) {
    return next(error);
  }
});

// Update category (Protected)
router.put('/:id', authSupabase, resolveTenantStrict, ensureTenantExists, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    const update = req.body ?? {};
    const updated = await Category.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

// Delete category (Protected)
router.delete('/:id', authSupabase, resolveTenantStrict, ensureTenantExists, loadMembership, authorize('admin'), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    const deleted = await Category.findOneAndDelete({ _id: id, tenantId });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});


