import prisma from '../../config/database.js';

// SSE subscribers: Map<userId, Set<res>>
const subscribers = new Map();

export function subscribe(userId, res) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set());
  subscribers.get(userId).add(res);
}

export function unsubscribe(userId, res) {
  subscribers.get(userId)?.delete(res);
}

export function broadcast(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  for (const connections of subscribers.values()) {
    for (const res of connections) {
      res.write(payload);
    }
  }
}

export async function getAlerts({ page = 1, limit = 20, status, type, classroom } = {}) {
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (classroom) where.classroom = { name: { contains: classroom, mode: 'insensitive' } };

  const [data, total] = await prisma.$transaction([
    prisma.alert.findMany({
      where,
      include: {
        classroom: { select: { id: true, name: true } },
        camera: { select: { id: true, name: true } },
        actions: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.alert.count({ where }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getAlertById(id) {
  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      classroom: true,
      camera: true,
      actions: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!alert) throw { status: 404, message: 'Alerta no encontrada' };
  return alert;
}

export async function confirmAlert(id, userId, notes) {
  await assertAlertPending(id);

  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.update({
      where: { id },
      data: { status: 'CONFIRMADA', resolvedAt: new Date() },
    });
    await tx.alertAction.create({
      data: { alertId: id, userId, action: 'CONFIRM', notes },
    });
    return alert;
  });
}

export async function discardAlert(id, userId, reason) {
  await assertAlertPending(id);

  return prisma.$transaction(async (tx) => {
    const alert = await tx.alert.update({
      where: { id },
      data: { status: 'DESCARTADA', discardReason: reason, resolvedAt: new Date() },
    });
    await tx.alertAction.create({
      data: { alertId: id, userId, action: 'DISCARD', notes: reason },
    });
    return alert;
  });
}

export async function escalateAlert(id, userId, coordinatorId) {
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) throw { status: 404, message: 'Alerta no encontrada' };
  if (alert.escalated) throw { status: 400, message: 'La alerta ya fue escalada' };

  return prisma.$transaction(async (tx) => {
    const updated = await tx.alert.update({
      where: { id },
      data: { escalated: true, escalatedToId: coordinatorId },
    });
    await tx.alertAction.create({
      data: { alertId: id, userId, action: 'ESCALATE' },
    });
    return updated;
  });
}

async function assertAlertPending(id) {
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) throw { status: 404, message: 'Alerta no encontrada' };
  if (alert.status !== 'PENDIENTE') {
    throw { status: 400, message: 'Solo se pueden modificar alertas en estado PENDIENTE' };
  }
}
