import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { getFaceModels } from '@/services/biometricService';

const CAPTURE_STEPS = [
  'Centra tu rostro dentro del cuadro.',
  'Alejate un poco de la camara y mantente de frente.',
  'Acercate de nuevo y mira directo a la camara.',
];

function captureFrame(video) {
  const canvas = document.createElement('canvas');
  const size = 480;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const crop = Math.min(sourceWidth, sourceHeight);
  const sx = (sourceWidth - crop) / 2;
  const sy = (sourceHeight - crop) / 2;

  ctx.drawImage(video, sx, sy, crop, crop, 0, 0, size, size);

  const descriptorCanvas = document.createElement('canvas');
  const descriptorSize = 16;
  descriptorCanvas.width = descriptorSize;
  descriptorCanvas.height = descriptorSize;
  const descriptorCtx = descriptorCanvas.getContext('2d');
  descriptorCtx.drawImage(canvas, 0, 0, descriptorSize, descriptorSize);

  const pixels = descriptorCtx.getImageData(0, 0, descriptorSize, descriptorSize).data;
  const values = [];
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3 / 255;
    values.push(gray);
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance) || 1;
  const descriptor = values.map((value) => Number(((value - mean) / std).toFixed(6)));

  return {
    imageDataUrl: canvas.toDataURL('image/jpeg', 0.82),
    descriptor,
  };
}

function averageDescriptors(descriptors) {
  if (!descriptors.length) return [];
  const size = descriptors[0].length;
  const averaged = Array.from({ length: size }, (_, index) => {
    const sum = descriptors.reduce((total, descriptor) => total + descriptor[index], 0);
    return Number((sum / descriptors.length).toFixed(6));
  });

  const mean = averaged.reduce((sum, value) => sum + value, 0) / averaged.length;
  const variance = averaged.reduce((sum, value) => sum + (value - mean) ** 2, 0) / averaged.length;
  const std = Math.sqrt(variance) || 1;
  return averaged.map((value) => Number(((value - mean) / std).toFixed(6)));
}

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
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [captures, setCaptures] = useState([]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setError('');
    setReady(false);
    try {
      try {
        const models = await getFaceModels();
        setModelVersion(models.modelVersion || 'insforge-image-descriptor-v1');
      } catch {
        setModelVersion('insforge-image-descriptor-v1');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (err) {
      setError(err.message || 'No se pudo activar la camara.');
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      startCamera();
    });
    return stopCamera;
  }, []);

  const handleSubmit = async () => {
    if (!videoRef.current || !ready) return;
    setError('');
    setSuccess('');

    const capture = captureFrame(videoRef.current);
    const nextCaptures = [...captures, capture];
    setCaptures(nextCaptures);

    const requiredCaptures = multiCapture ? CAPTURE_STEPS.length : 1;

    if (nextCaptures.length < requiredCaptures) {
      setSuccess(`Captura ${nextCaptures.length} de ${requiredCaptures} lista.`);
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({
        imageDataUrl: nextCaptures[0].imageDataUrl,
        descriptor: averageDescriptors(nextCaptures.map((item) => item.descriptor)),
        captures: nextCaptures.map((item) => item.imageDataUrl),
      });
      if (!result.passed) {
        setError(result.failureReason || 'No pudimos confirmar que eres la misma persona.');
        setCaptures([]);
        return;
      }
      setSuccess('Rostro verificado correctamente.');
      stopCamera();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || 'No se pudo completar la verificacion facial.');
      setCaptures([]);
    } finally {
      setLoading(false);
    }
  };

  const resetCaptures = () => {
    setCaptures([]);
    setError('');
    setSuccess('');
  };

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
          {multiCapture
            ? CAPTURE_STEPS[Math.min(captures.length, CAPTURE_STEPS.length - 1)]
            : 'Centra tu rostro dentro del cuadro.'}
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
          {CAPTURE_STEPS.map((step, index) => (
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
        disabled={!ready || loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0066cc] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0055aa] active:scale-[0.98] disabled:opacity-50 sm:text-base"
      >
        {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Camera className="h-5 w-5" />}
        {loading
          ? loadingLabel
          : multiCapture && captures.length < CAPTURE_STEPS.length - 1
            ? `CAPTURA ${captures.length + 1} DE ${CAPTURE_STEPS.length}`
            : submitLabel}
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
