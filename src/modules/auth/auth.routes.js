import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

export default router;
