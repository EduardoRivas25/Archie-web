import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, XCircle, MoveRight } from 'lucide-react';
import { getFaceModels } from '@/services/biometricService';
import {
  captureFaceDescriptor,
  hasDescriptorVariance,
  hasMeaningfulMovement,
  hasStableFacePosition,
  loadFaceApiModels,
} from '@/lib/faceApiClient';

const ENROLL_STEPS = [
  { icon: '😐', label: 'Frontal', instruction: 'Mira directamente a la cámara con el rostro centrado.' },
  { icon: '😐', label: 'Confirmación', instruction: 'Mantente de frente para confirmar tu rostro.' },
  { icon: '🔄', label: 'Movimiento', instruction: 'Inclina ligeramente la cabeza y vuelve a mirar a la cámara.' },
];

// La verificación ahora también exige movimiento real (anti-foto estática)
const VERIFY_STEPS = [
  { icon: '😐', label: 'Frontal', instruction: 'Mira directamente a la cámara con el rostro centrado.' },
  { icon: '↔️', label: 'Movimiento', instruction: 'Mueve levemente la cabeza hacia un lado y vuelve al frente.' },
  { icon: '🔄', label: 'Confirmación', instruction: 'Último paso: inclina levemente la cabeza y mira a la cámara.' },
];

export function FaceCaptureStep({
  title = 'Verificacion facial',
  description = 'Centra tu rostro y mantente frente a la camara.',
  submitLabel = 'Verificar rostro',
  loadingLabel = 'Procesando...',
  onSubmit,
  onSuccess,
  multiCapture = true,
  captureCount = 3,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraStartRef = useRef(0);
  const firstBoxRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [captures, setCaptures] = useState([]);

  const stopCamera = useCallback(() => {
    cameraStartRef.current += 1;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    const startId = cameraStartRef.current + 1;
    cameraStartRef.current = startId;

    setError('');
    setReady(false);
    setModelsReady(false);
    try {
      // Load models + camera in parallel for faster startup on mobile
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      const idealSize = isMobile ? 480 : 720;

      const [, , stream] = await Promise.all([
        // 1. Face models version (non-critical)
        getFaceModels()
          .then((m) => setModelVersion(m.modelVersion || 'face-api-js-v1'))
          .catch(() => setModelVersion('face-api-js-v1')),
        // 2. Face-api neural network models
        loadFaceApiModels().then(() => setModelsReady(true)),
        // 3. Camera stream
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: idealSize }, height: { ideal: idealSize } },
          audio: false,
        }),
      ]);

      if (cameraStartRef.current !== startId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          if (playError?.name !== 'AbortError') throw playError;
        }
      }
      if (cameraStartRef.current === startId) {
        setReady(true);
      }
    } catch (err) {
      setError(err.message || 'No se pudo activar la camara.');
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      startCamera();
    });
    return stopCamera;
  }, [startCamera, stopCamera]);

  const handleSubmit = async () => {
    if (!videoRef.current || !ready || !modelsReady) return;
    setError('');
    setSuccess('');

    const requiredCaptures = multiCapture ? ENROLL_STEPS.length : captureCount;
    const currentStep = captures.length;

    setLoading(true);
    try {
      const capture = await captureFaceDescriptor(videoRef.current);

      if (multiCapture && currentStep === 0) {
        firstBoxRef.current = capture.box;
      }

      // En ambos modos: exigir movimiento desde la primera captura en adelante
      if (currentStep === 0) {
        firstBoxRef.current = capture.box;
      }

      if (currentStep === 2 && !hasMeaningfulMovement(firstBoxRef.current, capture.box)) {
        // Solo pedir repetir ESTA foto, no reiniciar todas
        setError('Inclina ligeramente tu cabeza antes de esta captura. Inténtalo de nuevo.');
        return;
      }

      if (!multiCapture && currentStep > 0 && !hasStableFacePosition(captures[currentStep - 1]?.box, capture.box)) {
        // Solo pedir repetir ESTA foto
        setError('Mantente estable frente a la cámara. Repite esta captura.');
        return;
      }

      const nextCaptures = [...captures, capture];
      setCaptures(nextCaptures);

      if (nextCaptures.length < requiredCaptures) {
        setSuccess(`✅ Captura ${nextCaptures.length} de ${requiredCaptures} completada.`);
        return;
      }

      // ── Validación client-side de varianza (bloqueo previo al servidor) ──────
      const allDescriptors = nextCaptures.map((item) => item.descriptor);
      if (!hasDescriptorVariance(allDescriptors)) {
        // Solo quitar la última captura para reintentarla con más movimiento
        setError('Las capturas son muy similares. Mueve más la cabeza en esta captura.');
        setCaptures(nextCaptures.slice(0, -1));
        return;
      }

      const result = await onSubmit({
        imageDataUrl: nextCaptures[0].imageDataUrl,
        descriptor: nextCaptures[nextCaptures.length - 1].descriptor,
        descriptors: nextCaptures.map((item) => item.descriptor),
        captures: nextCaptures.map((item) => item.imageDataUrl),
        liveness: {
          movementDetected: multiCapture ? hasMeaningfulMovement(firstBoxRef.current, capture.box) : undefined,
        },
      });
      if (!result.passed) {
        setError(result.failureReason || 'No pudimos confirmar que eres la misma persona.');
        // Solo reiniciar la última captura, conservar las anteriores
        setCaptures(nextCaptures.slice(0, -1));
        return;
      }
      setSuccess('🎉 Rostro verificado correctamente.');
      stopCamera();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || 'No se pudo completar la verificación facial.');
      // No reiniciar todas las capturas — solo permitir reintentar la actual
    } finally {
      setLoading(false);
    }
  };

  const resetCaptures = () => {
    setCaptures([]);
    firstBoxRef.current = null;
    setError('');
    setSuccess('');
  };

  const steps = multiCapture ? ENROLL_STEPS : VERIFY_STEPS;
  const currentStepData = steps[Math.min(captures.length, steps.length - 1)];

  const buttonLabel = loading
    ? loadingLabel
    : captures.length < (multiCapture ? ENROLL_STEPS.length : captureCount) - 1
        ? `CAPTURA ${captures.length + 1} DE ${multiCapture ? ENROLL_STEPS.length : captureCount}`
        : submitLabel;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 sm:h-12 sm:w-12">
          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">{description}</p>
        {modelVersion && <p className="mt-1 text-xs text-gray-500">Modelo {modelVersion}</p>}
      </div>

      {/* ── Step Indicators ── */}
      {(multiCapture || captureCount > 1) && (
        <div className="face-steps-container">
          {steps.map((step, index) => {
            const isDone = index < captures.length;
            const isCurrent = index === captures.length;
            return (
              <div
                key={step.label}
                className={`face-step-card ${
                  isDone ? 'face-step-done' : isCurrent ? 'face-step-active' : 'face-step-pending'
                }`}
              >
                <span className="face-step-icon">{isDone ? '✅' : step.icon}</span>
                <span className="face-step-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mx-auto h-[clamp(200px,40dvh,320px)] w-full max-w-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#101010] shadow-inner sm:aspect-square sm:h-auto sm:max-h-none sm:max-w-none">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
        <div className={`pointer-events-none absolute inset-4 sm:inset-6 rounded-full border-2 shadow-[0_0_0_999px_rgba(0,0,0,0.22)] transition-colors duration-500 ${
          error ? 'border-red-400/60' : captures.length >= steps.length ? 'border-green-400/60' : 'border-blue-400/40'
        }`} />
        {/* Compact step badge on video — no long text to avoid overlap */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3 rounded-lg bg-black/70 px-3 py-1.5 sm:py-2 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-base leading-none sm:text-lg">{currentStepData.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 sm:text-xs">
              Paso {Math.min(captures.length + 1, steps.length)}/{steps.length} — {currentStepData.label}
            </span>
          </div>
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs text-gray-300">Cargando cámara y modelos…</span>
          </div>
        )}
      </div>

      {/* Instruction card BELOW the video — prevents overlap on mobile */}
      <div className="face-instruction-card">
        <span className="text-base leading-none">{currentStepData.icon}</span>
        <p className="text-xs font-medium leading-snug text-white/90 sm:text-sm">
          {currentStepData.instruction}
        </p>
      </div>

      {error && (
        <div className="face-feedback-error">
          <XCircle className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="mt-0.5 text-xs text-red-300/70">Solo necesitas repetir esta captura.</p>
          </div>
        </div>
      )}
      {success && (
        <div className="face-feedback-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* ── Progress bar ── */}
      {(multiCapture || captureCount > 1) && (
        <div className="face-progress-bar">
          <div
            className="face-progress-fill"
            style={{ width: `${(captures.length / steps.length) * 100}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!ready || !modelsReady || loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0055aa] active:scale-[0.98] disabled:opacity-50 sm:text-base"
      >
        {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Camera className="h-5 w-5" />}
        {buttonLabel}
      </button>

      {captures.length > 0 && !loading && (
        <button
          type="button"
          onClick={resetCaptures}
          className="w-full py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
          Reiniciar todas las capturas
        </button>
      )}

      {error && (
        <button
          type="button"
          onClick={startCamera}
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar cámara
        </button>
      )}
    </div>
  );
}
