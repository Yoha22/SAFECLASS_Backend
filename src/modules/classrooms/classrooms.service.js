import prisma from '../../config/database.js';

export async function getClassrooms() {
  return prisma.classroom.findMany({
    include: {
      cameras: { select: { id: true, name: true, status: true, active: true } },
      alerts: {
        where: { status: 'PENDIENTE' },
        select: { id: true, type: true, confidence: true, createdAt: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getClassroomById(id) {
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      cameras: true,
      alerts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actions: { include: { user: { select: { name: true, role: true } } } } },
      },
    },
  });
  if (!classroom) throw { status: 404, message: 'Salón no encontrado' };
  return classroom;
}
