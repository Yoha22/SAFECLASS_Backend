import * as camerasService from './cameras.service.js';

export async function list(req, res, next) {
  try {
    res.json(await camerasService.getCameras());
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    res.json(await camerasService.updateCamera(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function test(req, res, next) {
  try {
    res.json(await camerasService.testCamera(req.params.id));
  } catch (err) {
    next(err);
  }
}
