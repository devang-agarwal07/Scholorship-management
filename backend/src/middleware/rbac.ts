import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
      return;
    }

    next();
  };
};
