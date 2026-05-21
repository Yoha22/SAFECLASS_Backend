import { env } from '../config/env.js';

/**
 * Validates the X-API-Key header for internal service-to-service calls.
 * Used exclusively by the model service webhook (POST /api/internal/alert).
 * Does NOT use JWT — the model service is not a human user.
 *
 * If MODEL_SERVICE_API_KEY is empty, auth is skipped (development mode).
 */
export function authenticateInternal(req, res, next) {
  if (!env.modelService.apiKey) return next();

  const key = req.headers['x-api-key'];
  if (!key || key !== env.modelService.apiKey) {
    return res.status(401).json({ error: 'X-API-Key inválida o ausente' });
  }
  next();
}
