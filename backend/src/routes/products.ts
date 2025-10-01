import { Router } from 'express';
import type {} from '../types/express.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam, tenantParamMatchesJwt } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';

export const router = Router({ mergeParams: true });

// For all routes, ensure tenant id from params exists
router.use(tenantFromParam, ensureTenantExists);

// Create product
router.post('/', authSupabase, tenantParamMatchesJwt, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { categoryId, name, description, priceCents, imageUrl, availabilityStatus } = req.body ?? {};
    // Ensure referenced category (if provided) belongs to same tenant
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, tenantId }).lean();
      if (!category) return res.status(400).json({ error: 'Invalid category for tenant' });
    }
    const created = await Product.create({ tenantId, categoryId, name, description, priceCents, imageUrl, availabilityStatus });
    res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
});

// List products (optionally by category)
router.get('/', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { categoryId } = req.query as { categoryId?: string };
    const filter: any = { tenantId };
    if (categoryId) filter.categoryId = categoryId;
    const products = await Product.find(filter).lean();
    res.json({ data: products });
  } catch (error) {
    return next(error);
  }
});

// Update product
router.put('/:id', authSupabase, tenantParamMatchesJwt, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    const update = req.body ?? {};
    if (update.categoryId) {
      const category = await Category.findOne({ _id: update.categoryId, tenantId }).lean();
      if (!category) return res.status(400).json({ error: 'Invalid category for tenant' });
    }
    const updated = await Product.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

// Delete product
router.delete('/:id', authSupabase, tenantParamMatchesJwt, loadMembership, authorize('admin'), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    const deleted = await Product.findOneAndDelete({ _id: id, tenantId });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});


