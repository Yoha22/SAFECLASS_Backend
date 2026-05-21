import * as statsService from './stats.service.js';

export async function dashboard(req, res, next) {
  try {
    res.json(await statsService.getDashboardStats());
  } catch (err) {
    next(err);
  }
}

export async function coordinator(req, res, next) {
  try {
    res.json(await statsService.getCoordinatorStats({ period: req.query.period }));
  } catch (err) {
    next(err);
  }
}

export async function system(req, res, next) {
  try {
    res.json(await statsService.getSystemStats());
  } catch (err) {
    next(err);
  }
}

export async function updateThreshold(req, res, next) {
  try {
    const { threshold } = req.body ?? {};
    if (typeof threshold !== 'number' || threshold < 0.5 || threshold > 0.95) {
      return res.status(400).json({ error: 'threshold debe ser un número entre 0.50 y 0.95' });
    }
    res.json(await statsService.updateModelThreshold(threshold));
  } catch (err) {
    next(err);
  }
}
