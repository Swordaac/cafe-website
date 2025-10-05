export function authorize(required) {
    const requiredList = Array.isArray(required) ? required : [required];
    const rank = { viewer: 1, editor: 2, admin: 3 };
    const minRank = Math.max(...requiredList.map((r) => rank[r]));
    return (req, res, next) => {
        const membership = req.membership;
        if (!membership)
            return res.status(403).json({ error: 'Membership required' });
        if (rank[membership.role] < minRank)
            return res.status(403).json({ error: 'Access denied' });
        return next();
    };
}
//# sourceMappingURL=authorize.js.map