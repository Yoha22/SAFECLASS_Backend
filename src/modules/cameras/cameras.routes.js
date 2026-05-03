import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as ctrl from './cameras.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.list);
router.put('/:id', requireRole('administrador'), ctrl.update);
router.post('/:id/test', requireRole('administrador'), ctrl.test);

export default router;
