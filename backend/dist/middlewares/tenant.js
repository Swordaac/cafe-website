import { env } from '../config/env.js';
function fromHeader(req) {
    const value = req.headers[env.tenantHeader];
    if (!value)
        return undefined;
    if (Array.isArray(value))
        return value[0];
    return String(value);
}
function fromSubdomain(req) {
    const host = req.headers.host;
    if (!host)
        return undefined;
    const withoutPort = host.split(':')[0];
    if (!withoutPort.endsWith(env.baseDomain))
        return undefined;
    const parts = withoutPort.replace(`.${env.baseDomain}`, '').split('.');
    const sub = parts[parts.length - 1];
    if (!sub || sub === 'www' || sub === env.baseDomain)
        return undefined;
    return sub;
}
function fromPath(req) {
    const url = req.originalUrl || req.url || '';
    const pathOnly = url.split('?')[0];
    const segments = pathOnly.split('/').filter(Boolean);
    const v1Index = segments.indexOf('v1');
    const tenantIndex = v1Index >= 0 ? v1Index + 1 : 0;
    return segments[tenantIndex];
}
export function resolveTenant(req, _res, next) {
    let tenantId;
    switch (env.tenantStrategy) {
        case 'header':
            tenantId = fromHeader(req);
            break;
        case 'subdomain':
            tenantId = fromSubdomain(req);
            break;
        case 'path':
            tenantId = fromPath(req);
            break;
        default:
            tenantId = undefined;
    }
    if (!tenantId) {
        return next(new Error('Tenant not resolved'));
    }
    req.tenant = { id: tenantId };
    return next();
}
export function tenantFromParam(req, _res, next) {
    const paramTenantId = req.params.tenantId;
    if (paramTenantId) {
        req.tenant = { id: String(paramTenantId) };
    }
    return next();
}
export function tenantParamMatchesJwt(req, res, next) {
    const paramTenantId = req.params.tenantId;
    const jwtTenantId = req.auth?.tenantId;
    if (paramTenantId && jwtTenantId && paramTenantId !== jwtTenantId) {
        return res.status(403).json({ error: 'Tenant mismatch' });
    }
    return next();
}
//# sourceMappingURL=tenant.js.map