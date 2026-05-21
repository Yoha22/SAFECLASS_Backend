import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  // SSE connections (EventSource) cannot send custom headers, so the frontend
  // passes the JWT as ?token= query param for the /api/alerts/stream endpoint.
  const raw = header?.startsWith('Bearer ')
    ? header.slice(7)
    : req.query.token ?? null;

  if (!raw) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    req.user = jwt.verify(raw, env.jwt.secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
