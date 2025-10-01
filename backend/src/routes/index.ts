import { Router } from 'express';
import { router as menuItems } from './menuItems.js';
import { router as categories } from './categories.js';
import { router as products } from './products.js';
import { router as tenants } from './tenants.js';
import { env } from '../config/env.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.use('/tenants', tenants);
router.use('/tenants/:tenantId/categories', categories);
router.use('/tenants/:tenantId/products', products);

if (env.tenantStrategy === 'path') {
  router.use('/:tenant/menu-items', menuItems);
} else {
  router.use('/menu-items', menuItems);
}


