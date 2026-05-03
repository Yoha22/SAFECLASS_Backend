export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Error interno del servidor';

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err);
  }

  res.status(status).json({ error: message });
}
