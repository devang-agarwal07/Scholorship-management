import { Router } from 'express';
import { scholarshipController } from './scholarship.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// Public-ish (any authenticated user can list)
router.get('/', authenticate, (req, res, next) => scholarshipController.findAll(req, res, next));
router.get('/:id', authenticate, (req, res, next) => scholarshipController.findById(req, res, next));
router.get('/:id/eligibility', authenticate, authorize('STUDENT'), (req, res, next) =>
  scholarshipController.checkEligibility(req, res, next)
);

// Admin only
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  scholarshipController.create(req, res, next)
);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  scholarshipController.update(req, res, next)
);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  scholarshipController.remove(req, res, next)
);

export default router;
