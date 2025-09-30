import { Router } from 'express';
import { router as menuItems } from './menuItems.js';
import { env } from '../config/env.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

if (env.tenantStrategy === 'path') {
  router.use('/:tenant/menu-items', menuItems);
} else {
  router.use('/menu-items', menuItems);
}


