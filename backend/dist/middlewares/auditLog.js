export function auditLog(req, _res, next) {
    const tenantId = req.tenant?.id || null;
    const userId = req.auth?.userId || null;
    const route = `${req.method} ${req.originalUrl}`;
    // Structured log
    console.info(JSON.stringify({
        level: 'info',
        event: 'api_request',
        tenantId,
        userId,
        route,
        ip: req.ip,
        userAgent: req.get('user-agent') || null,
        time: new Date().toISOString(),
    }));
    return next();
}
//# sourceMappingURL=auditLog.js.map