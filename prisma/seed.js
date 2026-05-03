import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Users
  const hash = (pw) => bcrypt.hash(pw, 12);

  const [admin, coord, docente] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@iecol.edu.co' },
      update: {},
      create: { name: 'Admin SAFECLASS', email: 'admin@iecol.edu.co', passwordHash: await hash('admin1234'), role: 'administrador' },
    }),
    prisma.user.upsert({
      where: { email: 'coordinador@iecol.edu.co' },
      update: {},
      create: { name: 'Carlos Pérez', email: 'coordinador@iecol.edu.co', passwordHash: await hash('coord1234'), role: 'coordinador' },
    }),
    prisma.user.upsert({
      where: { email: 'maria.torres@iecol.edu.co' },
      update: {},
      create: { name: 'María Torres', email: 'maria.torres@iecol.edu.co', passwordHash: await hash('safeclass'), role: 'docente' },
    }),
  ]);

  // Classrooms
  const classrooms = await Promise.all(
    ['Salón A1', 'Salón A2', 'Salón B1', 'Salón B2', 'Patio Central'].map((name) =>
      prisma.classroom.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // Cameras
  const cameras = await Promise.all(
    classrooms.map((c, i) =>
      prisma.camera.upsert({
        where: { id: `cam-seed-${i}` },
        update: {},
        create: {
          id: `cam-seed-${i}`,
          name: `Cámara ${c.name}`,
          classroomId: c.id,
          rtspUrl: `rtsp://192.168.1.${10 + i}:554/stream`,
          active: i < 4,
          status: i < 4 ? 'online' : 'offline',
          fps: i < 4 ? 25 : 0,
          resolution: '1280x720',
          lastCheck: new Date(),
        },
      }),
    ),
  );

  // Sample alerts
  await prisma.alert.createMany({
    skipDuplicates: true,
    data: [
      { id: 'alert-seed-1', type: 'AGRESION', classroomId: classrooms[0].id, cameraId: cameras[0].id, confidence: 0.91, status: 'PENDIENTE' },
      { id: 'alert-seed-2', type: 'AISLAMIENTO', classroomId: classrooms[1].id, cameraId: cameras[1].id, confidence: 0.78, status: 'CONFIRMADA', resolvedAt: new Date() },
      { id: 'alert-seed-3', type: 'CAIDA', classroomId: classrooms[2].id, cameraId: cameras[2].id, confidence: 0.85, status: 'PENDIENTE' },
    ],
  });

  console.log('Seed completed.');
  console.log('Credentials:');
  console.log('  admin@iecol.edu.co / admin1234');
  console.log('  coordinador@iecol.edu.co / coord1234');
  console.log('  maria.torres@iecol.edu.co / safeclass');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
