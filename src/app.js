import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import alertsRoutes from './modules/alerts/alerts.routes.js';
import classroomsRoutes from './modules/classrooms/classrooms.routes.js';
import camerasRoutes from './modules/cameras/cameras.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/classrooms', classroomsRoutes);
app.use('/api/cameras', camerasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);

app.use(errorHandler);

export default app;
