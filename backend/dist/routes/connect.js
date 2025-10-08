import { Router } from 'express';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam, tenantParamMatchesJwt } from '../middlewares/tenant.js';
import { ensureConnectedAccount, createAccountLink } from '../services/stripe.js';
import { Tenant } from '../models/Tenant.js';
export const router = Router({ mergeParams: true });
// Create or fetch a connected account and return an onboarding link
router.post('/tenants/:tenantId/stripe/account-link', authSupabase, tenantFromParam, tenantParamMatchesJwt, async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId;
        const { returnUrl, refreshUrl } = req.body ?? {};
        if (!returnUrl || !refreshUrl)
            return res.status(400).json({ error: 'returnUrl and refreshUrl required' });
        const accountId = await ensureConnectedAccount(tenantId);
        const link = await createAccountLink(accountId, returnUrl, refreshUrl);
        return res.json({ data: { url: link.url, expiresAt: link.expires_at } });
    }
    catch (error) {
        return next(error);
    }
});
// Get current connect account status
router.get('/tenants/:tenantId/stripe/account', authSupabase, tenantFromParam, tenantParamMatchesJwt, async (req, res, next) => {
    try {
        const tenantId = req.params.tenantId;
        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant)
            return res.status(404).json({ error: 'Tenant not found' });
        return res.json({ data: tenant.stripe ?? null });
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=connect.js.map