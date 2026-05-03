import * as usersService from './users.service.js';

export async function list(req, res, next) {
  try {
    res.json(await usersService.getUsers({ role: req.query.role }));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email y role son requeridos' });
    }
    res.status(201).json(await usersService.createUser({ name, email, role, password }));
  } catch (err) {
    next(err);
  }
}

export async function toggle(req, res, next) {
  try {
    res.json(await usersService.toggleUser(req.params.id));
  } catch (err) {
    next(err);
  }
}
