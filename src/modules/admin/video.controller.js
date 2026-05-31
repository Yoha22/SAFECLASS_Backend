import multer from 'multer';
import * as videoService from './video.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Solo se permiten archivos de video.'));
  },
});

export const uploadMiddleware = upload.single('video');

/**
 * POST /api/admin/video/analyze
 * Accepts a video file, ensures the test camera exists, and submits the job
 * to the model service. Returns immediately with job_id (202 Accepted).
 */
export async function analyze(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo de video.' });
    }

    const camera = await videoService.getOrCreateTestCamera();

    const result = await videoService.analyzeVideo(
      camera.id,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    res.status(202).json({
      ...result,
      camera_id:   camera.id,
      camera_name: camera.name,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/video/status/:jobId
 * Proxies the job status query to the model service.
 */
export async function jobStatus(req, res, next) {
  try {
    const data = await videoService.getVideoJobStatus(req.params.jobId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
