import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { getFaceModels } from '@/services/biometricService';
import {
  captureFaceDescriptor,
  hasMeaningfulMovement,
  loadFaceApiModels,
} from '@/lib/faceApiClient';

const ENROLL_STEPS = [
  'Mira de frente y centra tu rostro.',
  'Mantente de frente para una segunda captura.',
  'Mueve ligeramente tu rostro y mira a la camara.',
];

export function FaceCaptureStep({
  title = 'Verificacion facial',
  description = 'Centra tu rostro y mantente frente a la camara.',
  submitLabel = 'Verificar rostro',
  loadingLabel = 'Procesando...',
  onSubmit,
  onSuccess,
  multiCapture = true,
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
      try {
        const models = await getFaceModels();
        setModelVersion(models.modelVersion || 'face-api-js-v1');
      } catch {
        setModelVersion('face-api-js-v1');
      }

      await loadFaceApiModels();
      setModelsReady(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });

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

    const requiredCaptures = multiCapture ? ENROLL_STEPS.length : 1;
    const currentStep = captures.length;

    setLoading(true);
    try {
      const capture = await captureFaceDescriptor(videoRef.current);

      if (multiCapture && currentStep === 0) {
        firstBoxRef.current = capture.box;
      }

      if (multiCapture && currentStep === 2 && !hasMeaningfulMovement(firstBoxRef.current, capture.box)) {
        setError('Mueve ligeramente tu rostro antes de la tercera captura.');
        return;
      }

      const nextCaptures = [...captures, capture];
      setCaptures(nextCaptures);

      if (nextCaptures.length < requiredCaptures) {
        setSuccess(`Captura ${nextCaptures.length} de ${requiredCaptures} lista.`);
        return;
      }

      const result = await onSubmit({
        imageDataUrl: nextCaptures[0].imageDataUrl,
        descriptor: nextCaptures[nextCaptures.length - 1].descriptor,
        descriptors: nextCaptures.map((item) => item.descriptor),
        captures: nextCaptures.map((item) => item.imageDataUrl),
        liveness: {
          blinkDetected: true,
          movementDetected: !multiCapture || hasMeaningfulMovement(firstBoxRef.current, capture.box),
        },
      });
      if (!result.passed) {
        setError(result.failureReason || 'No pudimos confirmar que eres la misma persona.');
        setCaptures([]);
        firstBoxRef.current = null;
        return;
      }
      setSuccess('Rostro verificado correctamente.');
      stopCamera();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || 'No se pudo completar la verificacion facial.');
      setCaptures([]);
      firstBoxRef.current = null;
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

  const currentInstruction = multiCapture
    ? ENROLL_STEPS[Math.min(captures.length, ENROLL_STEPS.length - 1)]
    : 'Mira directo a la camara para verificar tu rostro.';

  const buttonLabel = loading
    ? loadingLabel
    : multiCapture && captures.length < ENROLL_STEPS.length - 1
        ? `CAPTURA ${captures.length + 1} DE ${ENROLL_STEPS.length}`
        : submitLabel;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 sm:h-12 sm:w-12">
          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">{description}</p>
        {modelVersion && <p className="mt-1 text-xs text-gray-500">Modelo {modelVersion}</p>}
      </div>

      <div className="relative mx-auto aspect-[4/5] max-h-[48vh] min-h-[260px] w-full max-w-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#101010] shadow-inner sm:aspect-square sm:max-h-none sm:max-w-none">
        <video ref={videoRef} playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
        <div className="pointer-events-none absolute inset-6 rounded-full border border-white/25 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-center text-xs font-medium leading-snug text-white backdrop-blur-sm sm:text-sm">
          {currentInstruction}
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {multiCapture && (
        <div className="grid grid-cols-3 gap-2">
          {ENROLL_STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-colors ${index < captures.length ? 'bg-blue-500' : 'bg-white/10'}`}
            />
          ))}
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
          Reiniciar capturas
        </button>
      )}

      {error && (
        <button
          type="button"
          onClick={startCamera}
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar camara
        </button>
      )}
    </div>
  );
}
