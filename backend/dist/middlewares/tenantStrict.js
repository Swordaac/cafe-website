export function resolveTenantStrict(req, res, next) {
    const jwtTenantId = req.auth?.tenantId;
    const paramTenantId = req.params?.tenantId;
    if (!jwtTenantId)
        return res.status(401).json({ error: 'Unauthorized' });
    if (paramTenantId && paramTenantId !== jwtTenantId) {
        return res.status(403).json({ error: 'Tenant mismatch' });
    }
    req.tenant = { id: jwtTenantId };
    return next();
}
//# sourceMappingURL=tenantStrict.js.map