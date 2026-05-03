import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as ctrl from './users.controller.js';

const router = Router();

router.use(authenticate, requireRole('administrador'));
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id/toggle', ctrl.toggle);

export default router;
