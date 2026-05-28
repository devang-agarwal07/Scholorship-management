import { Router } from 'express';
import { workflowController } from './workflow.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// Take workflow action on application
router.post('/:applicationId/action', authenticate, authorize('VERIFIER', 'COMMITTEE', 'ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  workflowController.takeAction(req, res, next)
);

// Bulk workflow actions
router.post('/bulk-action', authenticate, authorize('COMMITTEE', 'ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  workflowController.bulkAction(req, res, next)
);

// Get workflow history for an application
router.get('/:applicationId/history', authenticate, (req, res, next) =>
  workflowController.getHistory(req, res, next)
);

// Get available actions for a given status
router.get('/actions/:status', authenticate, (req, res, next) =>
  workflowController.getAvailableActions(req, res, next)
);

export default router;
