import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
export function createTenantRateLimiter() {
    return rateLimit({
        windowMs: env.rateLimit.windowMs,
        max: env.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const tenantId = req.tenant?.id;
            // Fallback to IP if tenant is not yet resolved
            const base = tenantId || req.ip || 'unknown';
            // Differentiate by route + method to avoid cross-endpoint coupling
            return `${base}:${req.method}:${req.baseUrl}${req.path}`;
        },
        skip: (req) => req.method !== 'POST',
        message: { error: 'Too many requests, please try again later.' },
    });
}
//# sourceMappingURL=rateLimit.js.map