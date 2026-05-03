import { cpus, totalmem, freemem } from 'os';
import prisma from '../../config/database.js';

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalAlerts, criticalAlerts, resolvedToday, avgResult] =
    await prisma.$transaction([
      prisma.alert.count(),
      prisma.alert.count({ where: { type: 'AGRESION', status: 'PENDIENTE' } }),
      prisma.alert.count({ where: { status: { in: ['CONFIRMADA', 'DESCARTADA'] }, resolvedAt: { gte: today } } }),
      prisma.alert.aggregate({ _avg: { confidence: true } }),
    ]);

  return {
    totalAlerts,
    criticalAlerts,
    resolvedToday,
    avgConfidence: +(avgResult._avg.confidence ?? 0).toFixed(2),
  };
}

export async function getCoordinatorStats({ period = 'weekly' } = {}) {
  const now = new Date();
  const from = new Date(now);

  const days = { weekly: 7, monthly: 30, quarterly: 90, yearly: 365 }[period] ?? 7;
  from.setDate(from.getDate() - days);

  const alerts = await prisma.alert.findMany({
    where: { createdAt: { gte: from } },
    include: { classroom: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const byDay = buildByDay(alerts, days);
  const byType = buildByType(alerts);
  const heatmap = buildHeatmap(alerts);
  const classroomRanking = buildClassroomRanking(alerts);

  return { period, from, to: now, byDay, byType, heatmap, classroomRanking };
}

export async function getSystemStats() {
  const total = totalmem();
  const free = freemem();
  const ramPercent = +(((total - free) / total) * 100).toFixed(1);

  const cpuPercent = await getCpuUsage();

  const modules = await prisma.$queryRaw`SELECT 1`.then(() => [
    { name: 'Base de Datos', status: 'ok' },
    { name: 'Captura', status: 'ok' },
    { name: 'IA', status: 'ok' },
    { name: 'Notificaciones', status: 'ok' },
  ]).catch(() => [
    { name: 'Base de Datos', status: 'error' },
    { name: 'Captura', status: 'ok' },
    { name: 'IA', status: 'ok' },
    { name: 'Notificaciones', status: 'ok' },
  ]);

  return {
    cpuPercent,
    ramPercent,
    ramUsedMB: Math.round((total - free) / 1024 / 1024),
    ramTotalMB: Math.round(total / 1024 / 1024),
    fps: null,        // populated by AI module
    inferenceMs: null,
    modules,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function buildByDay(alerts, days) {
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const a of alerts) {
    const key = a.createdAt.toISOString().slice(0, 10);
    if (key in map) map[key]++;
  }
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

function buildByType(alerts) {
  const map = { AGRESION: 0, AISLAMIENTO: 0, CAIDA: 0, OTRO: 0 };
  for (const a of alerts) map[a.type] = (map[a.type] ?? 0) + 1;
  return Object.entries(map).map(([type, count]) => ({ type, count }));
}

function buildHeatmap(alerts) {
  const slots = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({ day, hour, count: 0 })),
  );
  for (const a of alerts) {
    const day = a.createdAt.getDay();
    const hour = a.createdAt.getHours();
    slots[day][hour].count++;
  }
  return slots.flat();
}

function buildClassroomRanking(alerts) {
  const map = {};
  for (const a of alerts) {
    const name = a.classroom.name;
    map[name] = (map[name] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([classroom, count]) => ({ classroom, count }))
    .sort((a, b) => b.count - a.count);
}

function getCpuUsage() {
  const before = cpuSnapshot();
  return new Promise((resolve) => {
    setTimeout(() => {
      const after = cpuSnapshot();
      const idle = after.idle - before.idle;
      const total = after.total - before.total;
      resolve(total === 0 ? 0 : +(100 - (100 * idle) / total).toFixed(1));
    }, 200);
  });
}

function cpuSnapshot() {
  let idle = 0, total = 0;
  for (const cpu of cpus()) {
    for (const [, time] of Object.entries(cpu.times)) total += time;
    idle += cpu.times.idle;
  }
  return { idle, total };
}
