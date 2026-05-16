import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { getFaceModels } from '@/services/biometricService';

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

export function FaceCaptureStep({
  title = 'Verificacion facial',
  description = 'Centra tu rostro y mantente frente a la camara.',
  submitLabel = 'Verificar rostro',
  loadingLabel = 'Procesando...',
  onSubmit,
  onSuccess,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modelVersion, setModelVersion] = useState('');

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
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const capture = captureFrame(videoRef.current);
      const result = await onSubmit(capture);
      if (!result.passed) {
        setError(result.failureReason || 'No pudimos confirmar que eres la misma persona.');
        return;
      }
      setSuccess('Rostro verificado correctamente.');
      stopCamera();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message || 'No se pudo completar la verificacion facial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
        {modelVersion && <p className="mt-1 text-xs text-gray-500">Modelo {modelVersion}</p>}
      </div>

      <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
        <video ref={videoRef} playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!ready || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066cc] py-2.5 font-medium text-white shadow-sm transition-all hover:bg-[#0055aa] active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Camera className="h-5 w-5" />}
        {loading ? loadingLabel : submitLabel}
      </button>

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
