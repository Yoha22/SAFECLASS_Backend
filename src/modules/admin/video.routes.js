import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { analyze, jobStatus, uploadMiddleware } from './video.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('administrador'));

router.post('/analyze', uploadMiddleware, analyze);
router.get('/status/:jobId', jobStatus);

export default router;
