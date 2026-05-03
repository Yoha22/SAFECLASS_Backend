import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';

export async function getUsers({ role } = {}) {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    select: { id: true, name: true, email: true, role: true, active: true, lastSession: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
}

export async function createUser({ name, email, role, password }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw { status: 409, message: 'El email ya está registrado' };

  const passwordHash = await bcrypt.hash(password ?? 'safeclass2024', 12);
  return prisma.user.create({
    data: { name, email, role, passwordHash },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
}

export async function toggleUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };

  return prisma.user.update({
    where: { id },
    data: { active: !user.active },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}
