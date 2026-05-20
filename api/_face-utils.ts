import type { VercelRequest } from '@vercel/node';
import { createClient } from '@insforge/sdk';

export const FACE_MODEL_VERSION = 'face-api-js-v1';
export const FACE_DISTANCE_THRESHOLD = 0.46;
export const FACE_VERIFICATION_CAPTURE_COUNT = 3;
export const FACE_VERIFICATION_REQUIRED_MATCHES = 3;
// Varianza mínima entre descriptores: si todas las capturas son casi idénticas
// (foto estática), la std dev de sus distancias internas será < este umbral.
export const FACE_DESCRIPTOR_VARIANCE_THRESHOLD = 0.018;

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

export interface FaceEnrollmentDescriptor {
  version: string;
  descriptors: number[][];
  captureCount: number;
  livenessRequired: boolean;
}

export function validateDescriptor(descriptor: unknown) {
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
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

export function validateDescriptorSet(descriptors: unknown) {
  if (!Array.isArray(descriptors) || descriptors.length !== FACE_VERIFICATION_CAPTURE_COUNT) {
    throw new Error('Se requieren 3 capturas faciales validas.');
  }

  return descriptors.map((descriptor) => validateDescriptor(descriptor));
}

export function validateLiveness(liveness: unknown, requireMovement = false) {
  const payload = liveness as { blinkDetected?: unknown; movementDetected?: unknown } | null;
  if (requireMovement && !payload?.movementDetected) {
    throw new Error('No se detecto movimiento suficiente. Vuelve a registrar tu rostro.');
  }
}

export function normalizeEnrollmentDescriptor(raw: unknown): FaceEnrollmentDescriptor | null {
  const payload = raw as Partial<FaceEnrollmentDescriptor> | number[] | null;
  if (!payload || Array.isArray(payload)) return null;
  if (payload.version !== FACE_MODEL_VERSION || !Array.isArray(payload.descriptors)) return null;

  return {
    version: FACE_MODEL_VERSION,
    descriptors: payload.descriptors.map((descriptor) => validateDescriptor(descriptor)),
    captureCount: Number(payload.captureCount || payload.descriptors.length),
    livenessRequired: payload.livenessRequired !== false,
  };
}

export function compareDescriptorDistance(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    sum += (a[index] - b[index]) ** 2;
  }

  return Number(Math.sqrt(sum).toFixed(6));
}

export function distanceToScore(distance: number) {
  if (!Number.isFinite(distance)) return 0;
  return Number(Math.max(0, Math.min(1, 1 - distance / 1.2)).toFixed(4));
}

/**
 * Calcula la distancia promedio ponderada entre el descriptor capturado y TODOS
 * los descriptores enrollados (no solo el mejor). Esto evita que una captura
 * aislada que coincida con uno solo de los descriptores sea suficiente.
 */
export function compareAgainstEnrollment(descriptor: number[], enrollment: FaceEnrollmentDescriptor) {
  const distances = enrollment.descriptors.map((stored) => compareDescriptorDistance(descriptor, stored));
  const bestDistance = Math.min(...distances);
  // Promedio ponderado: 60% mejor + 40% promedio general para mayor robustez
  const avgDistance = distances.reduce((s, d) => s + d, 0) / distances.length;
  const weightedDistance = bestDistance * 0.6 + avgDistance * 0.4;
  return {
    distance: Number(weightedDistance.toFixed(6)),
    score: distanceToScore(weightedDistance),
  };
}

/**
 * Detecta si un conjunto de descriptores proviene de una foto estática.
 * Capturas reales tienen varianza interna (el usuario se movió ligeramente).
 * Una foto impresa o pantalla produce descriptores casi idénticos.
 */
export function hasDescriptorVariance(descriptors: number[][]): boolean {
  if (descriptors.length < 2) return true;
  const pairDistances: number[] = [];
  for (let i = 0; i < descriptors.length; i++) {
    for (let j = i + 1; j < descriptors.length; j++) {
      pairDistances.push(compareDescriptorDistance(descriptors[i], descriptors[j]));
    }
  }
  const avg = pairDistances.reduce((s, d) => s + d, 0) / pairDistances.length;
  return avg >= FACE_DESCRIPTOR_VARIANCE_THRESHOLD;
}

export function compareDescriptorSetAgainstEnrollment(
  descriptors: number[][],
  enrollment: FaceEnrollmentDescriptor,
  threshold: number
) {
  const results = descriptors.map((descriptor) => compareAgainstEnrollment(descriptor, enrollment));
  const acceptedCaptures = results.filter((result) => result.distance <= threshold).length;
  const bestDistance = Math.min(...results.map((result) => result.distance));
  const averageDistance = results.reduce((sum, result) => sum + result.distance, 0) / results.length;
  const passed = acceptedCaptures >= FACE_VERIFICATION_REQUIRED_MATCHES;

  return {
    acceptedCaptures,
    requiredCaptures: FACE_VERIFICATION_REQUIRED_MATCHES,
    distance: Number(bestDistance.toFixed(6)),
    averageDistance: Number(averageDistance.toFixed(6)),
    score: distanceToScore(bestDistance),
    passed,
    technicalReason: passed
      ? null
      : `Solo ${acceptedCaptures} de ${FACE_VERIFICATION_CAPTURE_COUNT} capturas coincidieron dentro del umbral.`,
  };
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
    descriptor: FaceEnrollmentDescriptor | number[];
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
  edgeFunctionToken?: string,
  diagnostics?: {
    distance?: number;
    threshold?: number;
    acceptedCaptures?: number;
    technicalReason?: string | null;
  }
) {
  const client = getServerInsforge(edgeFunctionToken);
  const attemptPayload = {
    user_id: userId,
    model_version: FACE_MODEL_VERSION,
    score,
    passed,
    failure_reason: failureReason,
    distance: diagnostics?.distance,
    threshold: diagnostics?.threshold,
    accepted_captures: diagnostics?.acceptedCaptures,
    technical_reason: diagnostics?.technicalReason,
  };
  const { error } = await client.database
    .from('face_verification_attempts')
    .insert([attemptPayload]);

  if (error && diagnostics) {
    const message = String(error.message || '');
    const likelyMissingDiagnosticsColumns =
      message.includes('distance') ||
      message.includes('threshold') ||
      message.includes('accepted_captures') ||
      message.includes('technical_reason') ||
      message.includes('schema cache');

    if (likelyMissingDiagnosticsColumns) {
      const { error: retryError } = await client.database
        .from('face_verification_attempts')
        .insert([{
          user_id: userId,
          model_version: FACE_MODEL_VERSION,
          score,
          passed,
          failure_reason: failureReason,
        }]);

      if (!retryError) return;
    }
  }

  if (error) {
    throw new Error(`No se pudo registrar el intento facial. Ejecuta setup_biometrics.sql en InsForge. Detalle: ${error.message}`);
  }
}
