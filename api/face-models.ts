import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FACE_MODEL_VERSION, getServerInsforge } from './_face-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const client = getServerInsforge();
    const { data, error } = await client.storage
      .from('face-models')
      .download('v1/manifest.json');

    if (error || !data) {
      return res.status(200).json({
        modelVersion: FACE_MODEL_VERSION,
        source: 'fallback',
        manifest: {
          name: 'InsForge image descriptor',
          version: FACE_MODEL_VERSION,
          storageKey: 'v1/manifest.json',
          note: 'Upload a manifest to the face-models bucket to replace this fallback metadata.',
        },
      });
    }

    const manifest = JSON.parse(await data.text());
    return res.status(200).json({
      modelVersion: manifest.version || FACE_MODEL_VERSION,
      source: 'insforge',
      manifest,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(200).json({
      modelVersion: FACE_MODEL_VERSION,
      source: 'fallback',
      manifest: {
        name: 'InsForge image descriptor',
        version: FACE_MODEL_VERSION,
        note: `Fallback activo: ${message}`,
      },
    });
  }
}
