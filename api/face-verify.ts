import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  compareDescriptorSetAgainstEnrollment,
  FACE_DISTANCE_THRESHOLD,
  FACE_MODEL_VERSION,
  getActiveEnrollment,
  normalizeEnrollmentDescriptor,
  requireUser,
  saveVerificationAttempt,
  validateDescriptorSet,
  validateLiveness,
} from './_face-utils.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, token } = await requireUser(req);
    const enrollment = await getActiveEnrollment(user.id, token);

    if (req.method === 'GET') {
      return res.status(200).json({
        enrolled: !!enrollment,
        status: enrollment?.status,
        modelVersion: enrollment?.model_version || FACE_MODEL_VERSION,
        needsReenrollment: !!enrollment && !normalizeEnrollmentDescriptor(enrollment.descriptor),
      });
    }

    if (!enrollment) {
      await saveVerificationAttempt(user.id, 0, false, 'No hay rostro registrado.', token, {
        acceptedCaptures: 0,
        technicalReason: 'La cuenta no tiene un registro facial activo.',
      });
      return res.status(409).json({ error: 'No hay rostro registrado para esta cuenta.' });
    }

    const { imageDataUrl, descriptors: rawDescriptors, liveness } = req.body ?? {};
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing imageDataUrl.' });
    }

    const storedDescriptor = normalizeEnrollmentDescriptor(enrollment.descriptor);
    if (!storedDescriptor) {
      await saveVerificationAttempt(user.id, 0, false, 'Registro facial incompatible. Re-registra tu rostro.', token, {
        acceptedCaptures: 0,
        technicalReason: 'El descriptor guardado no coincide con la version actual del modelo.',
      });
      return res.status(409).json({ error: 'Registro facial incompatible. Re-registra tu rostro.', code: 'REENROLL_REQUIRED' });
    }

    validateLiveness(liveness);
    const threshold = Number(enrollment.threshold || FACE_DISTANCE_THRESHOLD);
    if (!Array.isArray(rawDescriptors)) {
      return res.status(400).json({ error: 'Se requieren 3 capturas faciales validas.' });
    }
    const comparison = compareDescriptorSetAgainstEnrollment(
      validateDescriptorSet(rawDescriptors),
      storedDescriptor,
      threshold
    );
    const failureReason = comparison.passed
      ? null
      : comparison.acceptedCaptures > 0
        ? 'No hubo suficientes capturas consistentes. Centra tu rostro, mejora la luz e intenta de nuevo.'
        : 'El rostro no coincide con el registro. Revisa la luz, mira de frente y vuelve a intentar.';

    await saveVerificationAttempt(user.id, comparison.score, comparison.passed, failureReason, token, {
      distance: comparison.distance,
      threshold,
      acceptedCaptures: comparison.acceptedCaptures,
      technicalReason: comparison.technicalReason,
    });

    return res.status(200).json({
      passed: comparison.passed,
      score: comparison.score,
      threshold,
      distance: comparison.distance,
      acceptedCaptures: comparison.acceptedCaptures,
      requiredCaptures: comparison.requiredCaptures,
      averageDistance: comparison.averageDistance,
      modelVersion: enrollment.model_version,
      failureReason: failureReason || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
