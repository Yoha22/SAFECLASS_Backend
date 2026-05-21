import prisma from '../../config/database.js';
import { broadcast } from '../alerts/alerts.service.js';

/**
 * Maps model service class_name values to Prisma AlertType enum.
 * Both use the same names, but we validate explicitly to catch
 * unexpected values from future model versions.
 */
const CLASS_NAME_TO_ALERT_TYPE = {
  AGRESION:    'AGRESION',
  AISLAMIENTO: 'AISLAMIENTO',
  CAIDA:       'CAIDA',
  OTRO:        'OTRO',
};

/**
 * Receives detections from the model service webhook and persists
 * them as Alert records in the database.
 *
 * Each detection in the payload becomes one Alert row.
 * After creation, the alert is broadcast via SSE to all
 * connected frontend clients.
 *
 * @param {object} payload  - Deserialized request body from model service
 * @param {string} payload.camera_id         - UUID of the Camera in this database
 * @param {Array}  payload.detections        - Array of Detection objects
 * @param {string} payload.frame_quality     - "OK" | "LOW_LIGHT" | "NOISY" | "DISCARDED"
 * @param {number} payload.processing_time_ms
 * @param {string} payload.model_version
 * @returns {Promise<{created: number, alerts: Array}>}
 */
export async function createAlertsFromDetections(payload) {
  const { camera_id, detections, frame_quality } = payload;

  // Resolve camera and its classroom in one query
  const camera = await prisma.camera.findUnique({
    where: { id: camera_id },
    include: { classroom: { select: { id: true, name: true, status: true } } },
  });

  if (!camera) {
    throw { status: 404, message: `Cámara con id '${camera_id}' no encontrada` };
  }

  // If frame quality is not OK the model service already returns empty detections,
  // but we guard here too so a partial payload never writes bad data.
  if (!Array.isArray(detections) || detections.length === 0) {
    return { created: 0, alerts: [] };
  }

  const createdAlerts = [];

  for (const detection of detections) {
    const alertType = CLASS_NAME_TO_ALERT_TYPE[detection.class_name];
    if (!alertType) {
      // Unknown class from a future model version — skip gracefully
      continue;
    }

    const alert = await prisma.$transaction(async (tx) => {
      const newAlert = await tx.alert.create({
        data: {
          type:        alertType,
          classroomId: camera.classroomId,
          cameraId:    camera.id,
          confidence:  detection.confidence,
          status:      'PENDIENTE',
        },
        include: {
          classroom: { select: { id: true, name: true } },
          camera:    { select: { id: true, name: true } },
          actions: {
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Keep classroom status in sync: any pending alert → 'alert'
      if (camera.classroom.status !== 'alert') {
        await tx.classroom.update({
          where: { id: camera.classroomId },
          data:  { status: 'alert' },
        });
      }

      return newAlert;
    });

    // Notify all SSE-connected frontend clients immediately
    broadcast(alert);
    createdAlerts.push(alert);
  }

  return { created: createdAlerts.length, alerts: createdAlerts };
}
