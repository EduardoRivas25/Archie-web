import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  compareDescriptorSetAgainstEnrollment,
  FACE_DESCRIPTOR_VARIANCE_THRESHOLD,
  FACE_DISTANCE_THRESHOLD,
  FACE_MODEL_VERSION,
  getActiveEnrollment,
  getServerInsforge,
  hasDescriptorVariance,
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

    // ── Rate limiting: máximo 3 intentos fallidos en 5 minutos ─────────────────
    try {
      const client = getServerInsforge(token);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentAttempts } = await client.database
        .from('face_verification_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('passed', false)
        .gte('created_at', fiveMinutesAgo);
      if (Array.isArray(recentAttempts) && recentAttempts.length >= 3) {
        return res.status(429).json({
          error: 'Demasiados intentos fallidos. Espera 5 minutos antes de volver a intentarlo.',
          code: 'RATE_LIMITED',
        });
      }
    } catch {
      // Si falla la consulta de rate limiting, no bloqueamos al usuario
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

    // ── Liveness obligatorio: exigir movimiento real entre capturas ────────────
    validateLiveness(liveness, true);

    if (!Array.isArray(rawDescriptors)) {
      return res.status(400).json({ error: 'Se requieren 3 capturas faciales validas.' });
    }
    const validatedDescriptors = validateDescriptorSet(rawDescriptors);

    // ── Anti-foto estática: descriptores deben tener varianza suficiente ──────
    if (!hasDescriptorVariance(validatedDescriptors)) {
      await saveVerificationAttempt(user.id, 0, false, 'Foto estática detectada.', token, {
        acceptedCaptures: 0,
        technicalReason: `Las capturas son demasiado similares entre sí (varianza < ${FACE_DESCRIPTOR_VARIANCE_THRESHOLD}). Posible foto estática.`,
      });
      return res.status(403).json({
        passed: false,
        score: 0,
        threshold: FACE_DISTANCE_THRESHOLD,
        modelVersion: FACE_MODEL_VERSION,
        failureReason: 'Detectamos que las capturas no provienen de una persona real. Mira de frente y mueve ligeramente la cabeza.',
      });
    }

    const threshold = Number(enrollment.threshold || FACE_DISTANCE_THRESHOLD);
    const comparison = compareDescriptorSetAgainstEnrollment(
      validatedDescriptors,
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
