import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as ctrl from './alerts.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stream', ctrl.stream);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id/confirm', ctrl.confirm);
router.put('/:id/discard', ctrl.discard);
router.put('/:id/escalate', ctrl.escalate);

export default router;
