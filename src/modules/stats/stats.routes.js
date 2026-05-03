import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as ctrl from './stats.controller.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', ctrl.dashboard);
router.get('/coordinator', requireRole('coordinador', 'administrador'), ctrl.coordinator);
router.get('/system', requireRole('administrador'), ctrl.system);

export default router;
