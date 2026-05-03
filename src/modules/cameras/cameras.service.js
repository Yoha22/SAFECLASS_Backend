import { createConnection } from 'net';
import prisma from '../../config/database.js';

export async function getCameras() {
  return prisma.camera.findMany({
    include: { classroom: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function updateCamera(id, data) {
  const camera = await prisma.camera.findUnique({ where: { id } });
  if (!camera) throw { status: 404, message: 'Cámara no encontrada' };

  const allowed = {};
  if (data.name !== undefined) allowed.name = data.name;
  if (data.active !== undefined) allowed.active = data.active;
  if (data.rtspUrl !== undefined) allowed.rtspUrl = data.rtspUrl;

  return prisma.camera.update({ where: { id }, data: allowed });
}

export async function testCamera(id) {
  const camera = await prisma.camera.findUnique({ where: { id } });
  if (!camera) throw { status: 404, message: 'Cámara no encontrada' };

  const rtspUrl = new URL(camera.rtspUrl.replace('rtsp://', 'http://'));
  const host = rtspUrl.hostname;
  const port = rtspUrl.port ? parseInt(rtspUrl.port, 10) : 554;

  const reachable = await tcpCheck(host, port, 3000);

  const status = reachable ? 'online' : 'error';
  await prisma.camera.update({ where: { id }, data: { status, lastCheck: new Date() } });

  return { id, status, lastCheck: new Date() };
}

function tcpCheck(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeout);
    socket.on('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}
