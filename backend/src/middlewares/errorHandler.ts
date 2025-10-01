import type { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof Error) {
    const status = (err as any).status || 500;
    return res.status(status).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal Server Error' });
}




