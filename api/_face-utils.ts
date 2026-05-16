import type { VercelRequest } from '@vercel/node';
import { createClient } from '@insforge/sdk';

export const FACE_MODEL_VERSION = 'insforge-image-descriptor-v1';
export const FACE_THRESHOLD = 0.72;

export function getServerInsforge(edgeFunctionToken?: string) {
  const baseUrl = process.env.INSFORGE_URL || process.env.VITE_INSFORGE_URL;
  const anonKey = process.env.INSFORGE_SERVICE_KEY || process.env.INSFORGE_ANON_KEY || process.env.VITE_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('Faltan variables en Vercel: configura INSFORGE_URL y INSFORGE_SERVICE_KEY.');
  }

  return createClient({
    baseUrl,
    anonKey,
    edgeFunctionToken,
    isServerMode: true,
  });
}

export function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

export async function requireUser(req: VercelRequest) {
  const token = getBearerToken(req);
  if (!token) throw new Error('No hay token de sesion de InsForge. Cierra sesion e inicia de nuevo.');

  const client = getServerInsforge(token);
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) throw new Error('Sesion de InsForge invalida o expirada. Cierra sesion e inicia de nuevo.');

  return { user: data.user, token };
}

export function imageDataUrlToBuffer(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) throw new Error('Invalid image payload.');
  return Buffer.from(match[2], 'base64');
}

export function validateDescriptor(descriptor: unknown) {
  if (!Array.isArray(descriptor) || descriptor.length !== 256) {
    throw new Error('Descriptor facial invalido. Vuelve a capturar tu rostro.');
  }

  return descriptor.map((value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      throw new Error('Descriptor facial invalido. Vuelve a capturar tu rostro.');
    }
    return Number(numberValue.toFixed(6));
  });
}

export function compareDescriptors(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) return 0;
  const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Number(Math.max(0, Math.min(1, (cosine + 1) / 2)).toFixed(4));
}

export async function uploadReferencePhoto(userId: string, imageDataUrl: string) {
  const client = getServerInsforge();
  const buffer = imageDataUrlToBuffer(imageDataUrl);
  const key = `${userId}/${Date.now()}-reference.jpg`;
  const blob = new Blob([buffer], { type: 'image/jpeg' });

  const { data, error } = await client.storage
    .from('face-reference-photos')
    .upload(key, blob);

  if (error) {
    throw new Error(`No se pudo subir la foto a InsForge Storage. Verifica que exista el bucket privado "face-reference-photos". Detalle: ${error.message}`);
  }
  return data?.key || key;
}

export async function getActiveEnrollment(userId: string, edgeFunctionToken?: string) {
  const client = getServerInsforge(edgeFunctionToken);
  const { data, error } = await client.database
    .from('face_enrollments')
    .select()
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar face_enrollments. Ejecuta setup_biometrics.sql en InsForge. Detalle: ${error.message}`);
  }
  return data as {
    id: string;
    user_id: string;
    model_version: string;
    descriptor: number[];
    reference_photo_key: string;
    threshold: number;
    status: string;
  } | null;
}

export async function saveVerificationAttempt(
  userId: string,
  score: number,
  passed: boolean,
  failureReason: string | null,
  edgeFunctionToken?: string
) {
  const client = getServerInsforge(edgeFunctionToken);
  const { error } = await client.database
    .from('face_verification_attempts')
    .insert([{
      user_id: userId,
      model_version: FACE_MODEL_VERSION,
      score,
      passed,
      failure_reason: failureReason,
    }]);

  if (error) {
    throw new Error(`No se pudo registrar el intento facial. Ejecuta setup_biometrics.sql en InsForge. Detalle: ${error.message}`);
  }
}
