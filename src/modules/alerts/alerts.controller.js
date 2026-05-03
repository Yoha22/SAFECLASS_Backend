import * as alertsService from './alerts.service.js';

export async function stream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userId = req.user.sub;
  alertsService.subscribe(userId, res);

  res.write(': connected\n\n');

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    alertsService.unsubscribe(userId, res);
  });
}

export async function list(req, res, next) {
  try {
    const { page, limit, status, type, classroom } = req.query;
    const result = await alertsService.getAlerts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      type,
      classroom,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    res.json(await alertsService.getAlertById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function confirm(req, res, next) {
  try {
    const alert = await alertsService.confirmAlert(
      req.params.id,
      req.user.sub,
      req.body?.notes,
    );
    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function discard(req, res, next) {
  try {
    const alert = await alertsService.discardAlert(
      req.params.id,
      req.user.sub,
      req.body?.reason,
    );
    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function escalate(req, res, next) {
  try {
    const { coordinatorId } = req.body ?? {};
    if (!coordinatorId) return res.status(400).json({ error: 'coordinatorId requerido' });
    const alert = await alertsService.escalateAlert(
      req.params.id,
      req.user.sub,
      coordinatorId,
    );
    res.json(alert);
  } catch (err) {
    next(err);
  }
}
