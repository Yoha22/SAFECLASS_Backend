import { Router } from 'express';
import { authenticateInternal } from '../../middlewares/internal-auth.middleware.js';
import * as ctrl from './internal.controller.js';

const router = Router();

// All internal routes are authenticated with X-API-Key, not JWT.
// These endpoints are NOT meant to be exposed to the public internet.
router.use(authenticateInternal);

router.post('/alert', ctrl.receiveAlert);

export default router;
