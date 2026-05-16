import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  compareDescriptors,
  FACE_MODEL_VERSION,
  FACE_THRESHOLD,
  getActiveEnrollment,
  requireUser,
  saveVerificationAttempt,
  validateDescriptor,
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
      });
    }

    if (!enrollment) {
      await saveVerificationAttempt(user.id, 0, false, 'No hay rostro registrado.', token);
      return res.status(409).json({ error: 'No hay rostro registrado para esta cuenta.' });
    }

    const { imageDataUrl, descriptor: rawDescriptor } = req.body ?? {};
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing imageDataUrl.' });
    }

    const descriptor = validateDescriptor(rawDescriptor);
    const threshold = Number(enrollment.threshold || FACE_THRESHOLD);
    const score = compareDescriptors(descriptor, enrollment.descriptor);
    const passed = score >= threshold;
    const failureReason = passed ? null : 'El rostro no coincide con el registro.';

    await saveVerificationAttempt(user.id, score, passed, failureReason, token);

    return res.status(200).json({
      passed,
      score,
      threshold,
      modelVersion: enrollment.model_version,
      failureReason: failureReason || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
