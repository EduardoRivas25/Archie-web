import { getInsforgeAuthHeaders } from '@/lib/insforge';

export interface FaceEnrollmentStatus {
  enrolled: boolean;
  status?: string;
  modelVersion?: string;
  needsReenrollment?: boolean;
}

export interface FaceVerificationResult {
  passed: boolean;
  score: number;
  threshold: number;
  modelVersion: string;
  failureReason?: string;
  distance?: number;
  acceptedCaptures?: number;
  requiredCaptures?: number;
  averageDistance?: number;
}

export interface FaceCapturePayload {
  imageDataUrl: string;
  descriptor?: number[];
  descriptors?: number[][];
  captures?: string[];
  liveness?: {
    blinkDetected?: boolean;
    movementDetected?: boolean;
  };
}

export interface FaceModelsManifest {
  modelVersion: string;
  source: 'insforge' | 'fallback';
  manifest: Record<string, unknown>;
}

function authHeaders() {
  const headers = getInsforgeAuthHeaders();
  return {
    'Content-Type': 'application/json',
    ...(headers.Authorization ? { Authorization: headers.Authorization } : {}),
  };
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 240) };
  }
}

function throwApiError(response: Response, payload: Record<string, unknown>, fallback: string): never {
  const message = payload.error || payload.message || payload.details || response.statusText || fallback;
  if (response.status === 502) {
    throw new Error(
      'No esta corriendo el servidor local de funciones. Abre otra terminal y ejecuta: npm run dev:api'
    );
  }
  throw new Error(`[${response.status}] ${String(message)}`);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throwApiError(response, payload, 'Error biometrico.');
  }
  return payload as T;
}

export async function getFaceModels(): Promise<FaceModelsManifest> {
  const response = await fetch('/api/face-models', { headers: authHeaders() });
  const payload = await readResponsePayload(response);
  if (!response.ok) throwApiError(response, payload, 'No se pudieron cargar los modelos faciales.');
  return payload as FaceModelsManifest;
}

export async function enrollFace(capture: FaceCapturePayload) {
  return postJson<FaceVerificationResult>('/api/face-enroll', capture);
}

export async function verifyFace(capture: FaceCapturePayload) {
  const response = await fetch('/api/face-verify', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(capture),
  });

  const payload = await readResponsePayload(response);
  if (response.status === 409) {
    const failureReason = payload.code === 'REENROLL_REQUIRED' ? 'REENROLL_REQUIRED' : 'NO_ENROLLMENT';
    return {
      passed: false,
      score: 0,
      threshold: 0.46,
      modelVersion: 'face-api-js-v1',
      acceptedCaptures: 0,
      requiredCaptures: 3,
      failureReason,
    };
  }
  // Rate limiting: demasiados intentos fallidos
  if (response.status === 429) {
    return {
      passed: false,
      score: 0,
      threshold: 0.46,
      modelVersion: 'face-api-js-v1',
      acceptedCaptures: 0,
      requiredCaptures: 3,
      failureReason: 'RATE_LIMITED',
    };
  }
  // Anti-foto estática detectada en el servidor
  if (response.status === 403 && payload.failureReason) {
    return payload as FaceVerificationResult;
  }
  if (!response.ok) {
    throwApiError(response, payload, 'Error biometrico.');
  }
  return payload as FaceVerificationResult;
}

export async function getFaceEnrollmentStatus(): Promise<FaceEnrollmentStatus> {
  const response = await fetch('/api/face-verify', { headers: authHeaders() });
  const payload = await readResponsePayload(response);
  if (!response.ok) throwApiError(response, payload, 'No se pudo consultar el enrolamiento facial.');
  return payload as FaceEnrollmentStatus;
}
