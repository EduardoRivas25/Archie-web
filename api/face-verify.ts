import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  compareAgainstEnrollment,
  FACE_DISTANCE_THRESHOLD,
  FACE_MODEL_VERSION,
  getActiveEnrollment,
  normalizeEnrollmentDescriptor,
  requireUser,
  saveVerificationAttempt,
  validateDescriptor,
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
      await saveVerificationAttempt(user.id, 0, false, 'No hay rostro registrado.', token);
      return res.status(409).json({ error: 'No hay rostro registrado para esta cuenta.' });
    }

    const { imageDataUrl, descriptor: rawDescriptor, liveness } = req.body ?? {};
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing imageDataUrl.' });
    }

    const storedDescriptor = normalizeEnrollmentDescriptor(enrollment.descriptor);
    if (!storedDescriptor) {
      await saveVerificationAttempt(user.id, 0, false, 'Registro facial incompatible. Re-registra tu rostro.', token);
      return res.status(409).json({ error: 'Registro facial incompatible. Re-registra tu rostro.', code: 'REENROLL_REQUIRED' });
    }

    validateLiveness(liveness);
    const descriptor = validateDescriptor(rawDescriptor);
    const threshold = Number(enrollment.threshold || FACE_DISTANCE_THRESHOLD);
    const { distance, score } = compareAgainstEnrollment(descriptor, storedDescriptor);
    const passed = distance <= threshold;
    const failureReason = passed ? null : 'El rostro no coincide con el registro.';

    await saveVerificationAttempt(user.id, score, passed, failureReason, token);

    return res.status(200).json({
      passed,
      score,
      threshold,
      distance,
      modelVersion: enrollment.model_version,
      failureReason: failureReason || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
