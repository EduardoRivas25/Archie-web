import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FACE_MODEL_VERSION,
  FACE_THRESHOLD,
  getActiveEnrollment,
  getServerInsforge,
  requireUser,
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user, token } = await requireUser(req);
    const { imageDataUrl, descriptor: rawDescriptor } = req.body ?? {};
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing imageDataUrl.' });
    }

    const descriptor = validateDescriptor(rawDescriptor);
    const referencePhotoKey = `${user.id}/${Date.now()}-reference-client-capture.jpg`;
    const client = getServerInsforge(token);
    const existing = await getActiveEnrollment(user.id, token);

    if (existing) {
      const { error } = await client.database
        .from('face_enrollments')
        .update({
          model_version: FACE_MODEL_VERSION,
          descriptor,
          reference_photo_key: referencePhotoKey,
          threshold: FACE_THRESHOLD,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) {
        throw new Error(`No se pudo actualizar face_enrollments. Ejecuta setup_biometrics.sql en InsForge. Detalle: ${error.message}`);
      }
    } else {
      const { error } = await client.database
        .from('face_enrollments')
        .insert([{
          user_id: user.id,
          model_version: FACE_MODEL_VERSION,
          descriptor,
          reference_photo_key: referencePhotoKey,
          threshold: FACE_THRESHOLD,
          status: 'active',
        }]);
      if (error) {
        throw new Error(`No se pudo insertar en face_enrollments. Ejecuta setup_biometrics.sql en InsForge. Detalle: ${error.message}`);
      }
    }

    return res.status(200).json({
      passed: true,
      score: 1,
      threshold: FACE_THRESHOLD,
      modelVersion: FACE_MODEL_VERSION,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
