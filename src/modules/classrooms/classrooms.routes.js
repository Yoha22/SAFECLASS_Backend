import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as ctrl from './classrooms.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

export default router;
