import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// All report routes are admin-only
router.get('/summary', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'COMMITTEE'), (req, res, next) =>
  reportController.getSummary(req, res, next)
);

router.get('/applications', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reportController.getApplicationsReport(req, res, next)
);

router.get('/disbursement', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reportController.getDisbursementReport(req, res, next)
);

router.get('/pending-actions', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reportController.getPendingActions(req, res, next)
);

export default router;
