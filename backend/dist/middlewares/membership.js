import '../types/express.js';
import { Tenant } from '../models/Tenant.js';
import { Membership } from '../models/Membership.js';
export async function ensureTenantExists(req, res, next) {
    try {
        const tenantId = req.tenant?.id;
        console.log('Looking for tenant:', tenantId);
        if (!tenantId)
            return res.status(400).json({ error: 'Tenant not resolved' });
        const tenant = await Tenant.findById(tenantId).lean();
        console.log('Found tenant:', tenant);
        if (!tenant)
            return res.status(404).json({ error: 'Tenant not found' });
        return next();
    }
    catch (error) {
        return next(error);
    }
}
export async function loadMembership(req, res, next) {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.auth?.userId;
        if (!tenantId)
            return res.status(400).json({ error: 'Tenant not resolved' });
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const membership = await Membership.findOne({ tenantId, userId }).lean();
        req.membership = membership || null;
        return next();
    }
    catch (error) {
        return next(error);
    }
}
export function requireMembership(req, res, next) {
    const membership = req.membership;
    if (!membership)
        return res.status(403).json({ error: 'Membership required' });
    return next();
}
//# sourceMappingURL=membership.js.map