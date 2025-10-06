import { Router } from 'express';
import { Category } from '../models/Category.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam, tenantParamMatchesJwt } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';
export const router = Router({ mergeParams: true });
// For all routes, ensure tenant id from params exists
router.use(tenantFromParam, ensureTenantExists);
// Create category
router.post('/', authSupabase, tenantParamMatchesJwt, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { name, sortOrder } = req.body ?? {};
        const created = await Category.create({ tenantId, name, sortOrder });
        res.status(201).json({ data: created });
    }
    catch (error) {
        if (error?.code === 11000)
            return res.status(409).json({ error: 'Category already exists' });
        return next(error);
    }
});
// List categories
router.get('/', async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const categories = await Category.find({ tenantId }).sort({ sortOrder: 1, name: 1 }).lean();
        res.json({ data: categories });
    }
    catch (error) {
        return next(error);
    }
});
// Get single category by ID
router.get('/:id', async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const category = await Category.findOne({ _id: id, tenantId }).lean();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ data: category });
    }
    catch (error) {
        return next(error);
    }
});
// Update category
router.put('/:id', authSupabase, tenantParamMatchesJwt, loadMembership, authorize(['editor', 'admin']), async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const update = req.body ?? {};
        const updated = await Category.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
        if (!updated)
            return res.status(404).json({ error: 'Not found' });
        res.json({ data: updated });
    }
    catch (error) {
        return next(error);
    }
});
// Delete category
router.delete('/:id', authSupabase, tenantParamMatchesJwt, loadMembership, authorize('admin'), async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const deleted = await Category.findOneAndDelete({ _id: id, tenantId });
        if (!deleted)
            return res.status(404).json({ error: 'Not found' });
        res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=categories.js.map