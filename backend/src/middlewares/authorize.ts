import type { NextFunction, Request, Response } from 'express';

type Role = 'admin' | 'editor' | 'viewer';

export function authorize(required: Role | Role[]) {
  const requiredList = Array.isArray(required) ? required : [required];
  const rank: Record<Role, number> = { viewer: 1, editor: 2, admin: 3 };
  const minRank = Math.max(...requiredList.map((r) => rank[r]));

  return (req: Request, res: Response, next: NextFunction) => {
    const membership = (req as any).membership as { role: Role } | null | undefined;
    if (!membership) return res.status(403).json({ error: 'Membership required' });
    if (rank[membership.role] < minRank) return res.status(403).json({ error: 'Access denied' });
    return next();
  };
}


