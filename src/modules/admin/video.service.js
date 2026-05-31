import prisma from '../../config/database.js';
import { env } from '../../config/env.js';

const TEST_CLASSROOM_NAME = 'Laboratorio de Pruebas';
const TEST_CAMERA_NAME    = 'Cámara de Prueba (Video)';

/**
 * Returns the test camera, creating the classroom and camera records if they
 * don't exist yet. All video-test alerts are associated with this camera.
 */
export async function getOrCreateTestCamera() {
  let classroom = await prisma.classroom.findFirst({
    where: { name: TEST_CLASSROOM_NAME },
  });

  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: { name: TEST_CLASSROOM_NAME },
    });
  }

  let camera = await prisma.camera.findFirst({
    where: { name: TEST_CAMERA_NAME },
  });

  if (!camera) {
    camera = await prisma.camera.create({
      data: {
        name:        TEST_CAMERA_NAME,
        classroomId: classroom.id,
        rtspUrl:     'file://video-test',
        active:      true,
        status:      'online',
        resolution:  'N/A',
        lastCheck:   new Date(),
      },
    });
  }

  return camera;
}

/**
 * Forwards the uploaded video buffer to the model service for async analysis.
 * Returns the job info (job_id, status, message) from the model service.
 */
export async function analyzeVideo(cameraId, fileBuffer, mimetype, filename) {
  const form = new FormData();
  form.append('camera_id', cameraId);
  form.append(
    'video',
    new Blob([fileBuffer], { type: mimetype }),
    filename,
  );

  const resp = await fetch(`${env.modelService.url}/video/analyze`, {
    method:  'POST',
    body:    form,
    headers: { 'X-API-Key': env.modelService.apiKey },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw { status: resp.status, message: `Model service: ${text || resp.statusText}` };
  }

  return resp.json();
}

/**
 * Proxies a job-status request to the model service.
 */
export async function getVideoJobStatus(jobId) {
  const resp = await fetch(`${env.modelService.url}/video/status/${jobId}`, {
    headers: { 'X-API-Key': env.modelService.apiKey },
  });

  if (resp.status === 404) throw { status: 404, message: 'Job no encontrado' };
  if (!resp.ok) throw { status: resp.status, message: 'Error en el model service' };

  return resp.json();
}
