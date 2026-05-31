import * as camerasService from './cameras.service.js';

export async function list(req, res, next) {
  try {
    res.json(await camerasService.getCameras());
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, classroomId, rtspUrl } = req.body;
    if (!name || !classroomId || !rtspUrl) {
      return res.status(400).json({ error: 'name, classroomId y rtspUrl son requeridos' });
    }
    res.status(201).json(await camerasService.createCamera({ name, classroomId, rtspUrl }));
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
