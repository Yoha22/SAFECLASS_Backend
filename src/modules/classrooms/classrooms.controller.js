import * as classroomsService from './classrooms.service.js';

export async function list(req, res, next) {
  try {
    res.json(await classroomsService.getClassrooms());
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    res.json(await classroomsService.getClassroomById(req.params.id));
  } catch (err) {
    next(err);
  }
}
