import { Router } from 'express';
import { applicationController } from './application.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// Student creates application
router.post('/', authenticate, authorize('STUDENT'), (req, res, next) =>
  applicationController.create(req, res, next)
);

// List (role-filtered)
router.get('/', authenticate, (req, res, next) =>
  applicationController.findAll(req, res, next)
);

// Student's own applications
router.get('/my', authenticate, authorize('STUDENT'), (req, res, next) =>
  applicationController.getMyApplications(req, res, next)
);

// Single application detail
router.get('/:id', authenticate, (req, res, next) =>
  applicationController.findById(req, res, next)
);

// Update draft
router.put('/:id', authenticate, authorize('STUDENT'), (req, res, next) =>
  applicationController.update(req, res, next)
);

// Submit application
router.post('/:id/submit', authenticate, authorize('STUDENT'), (req, res, next) =>
  applicationController.submit(req, res, next)
);

export default router;
