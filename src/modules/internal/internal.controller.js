import * as internalService from './internal.service.js';

/**
 * POST /api/internal/alert
 *
 * Receives a detection payload from the model service and persists
 * the anomalies as Alert records. Only reachable with a valid X-API-Key.
 *
 * Expected body (PredictResponse + camera_id from video_capture.py):
 * {
 *   camera_id:           string   (UUID of the Camera row in this DB)
 *   detections:          Array<Detection>
 *   anomaly_detected:    boolean
 *   frame_quality:       "OK" | "LOW_LIGHT" | "NOISY" | "DISCARDED"
 *   processing_time_ms:  number
 *   model_version:       string
 * }
 */
export async function receiveAlert(req, res, next) {
  try {
    const { camera_id, detections, anomaly_detected } = req.body ?? {};

    if (!camera_id) {
      return res.status(400).json({ error: 'camera_id es requerido' });
    }

    // anomaly_detected=false means empty detections — nothing to persist
    if (!anomaly_detected || !Array.isArray(detections) || detections.length === 0) {
      return res.status(200).json({ created: 0, message: 'Sin anomalías en el frame' });
    }

    const result = await internalService.createAlertsFromDetections(req.body);

    res.status(201).json({
      created:  result.created,
      alert_ids: result.alerts.map((a) => a.id),
    });
  } catch (err) {
    next(err);
  }
}
