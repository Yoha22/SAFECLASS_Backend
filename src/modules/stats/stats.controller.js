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
