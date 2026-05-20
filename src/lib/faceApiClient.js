import * as faceapi from 'face-api.js';

const MODEL_URL = '/models/face-api';
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.62,
});

let modelsPromise;

export function loadFaceApiModels() {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return modelsPromise;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(points) {
  if (!points || points.length !== 6) return 1;
  const verticalA = distance(points[1], points[5]);
  const verticalB = distance(points[2], points[4]);
  const horizontal = distance(points[0], points[3]) || 1;
  return (verticalA + verticalB) / (2 * horizontal);
}

export function getBlinkMetric(landmarks) {
  const left = eyeAspectRatio(landmarks.getLeftEye());
  const right = eyeAspectRatio(landmarks.getRightEye());
  return (left + right) / 2;
}

function captureCanvas(video) {
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
  return canvas;
}

function estimateBrightness(canvas) {
  const sampleSize = 32;
  const sample = document.createElement('canvas');
  sample.width = sampleSize;
  sample.height = sampleSize;
  const sampleCtx = sample.getContext('2d');
  sampleCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);

  const pixels = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
  let total = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    total += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
  }
  return total / (pixels.length / 4) / 255;
}

function validateQuality(detection, video, brightness) {
  const box = detection.detection.box;
  const videoWidth = video.videoWidth || 1;
  const videoHeight = video.videoHeight || 1;
  const minVideoSide = Math.min(videoWidth, videoHeight);
  const faceSide = Math.min(box.width, box.height);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const centeredX = Math.abs(centerX - videoWidth / 2) / videoWidth;
  const centeredY = Math.abs(centerY - videoHeight / 2) / videoHeight;

  // Umbral más alto: el rostro debe ocupar al menos 28% del encuadre
  if (faceSide / minVideoSide < 0.28) {
    throw new Error('Acercate un poco mas a la camara.');
  }
  if (centeredX > 0.20 || centeredY > 0.20) {
    throw new Error('Centra tu rostro dentro del cuadro.');
  }
  if (brightness < 0.20) {
    throw new Error('Hay poca luz. Ilumina mejor tu rostro.');
  }
}

export function hasMeaningfulMovement(firstBox, currentBox) {
  if (!firstBox || !currentBox) return false;
  const centerA = {
    x: firstBox.x + firstBox.width / 2,
    y: firstBox.y + firstBox.height / 2,
  };
  const centerB = {
    x: currentBox.x + currentBox.width / 2,
    y: currentBox.y + currentBox.height / 2,
  };
  const centerDelta = distance(centerA, centerB);
  const sizeDelta = Math.abs(currentBox.width - firstBox.width);
  return centerDelta > firstBox.width * 0.08 || sizeDelta > firstBox.width * 0.08;
}

/**
 * Verifica que un conjunto de descriptores tenga suficiente varianza interna.
 * Si todos los descriptores son casi idénticos, probablemente vienen de una
 * foto estática (impresa o en pantalla). Umbral: distancia promedio >= 0.018.
 */
export function hasDescriptorVariance(descriptors) {
  if (!descriptors || descriptors.length < 2) return true;
  const pairDistances = [];
  for (let i = 0; i < descriptors.length; i++) {
    for (let j = i + 1; j < descriptors.length; j++) {
      const a = descriptors[i];
      const b = descriptors[j];
      let sum = 0;
      for (let k = 0; k < a.length; k++) sum += (a[k] - b[k]) ** 2;
      pairDistances.push(Math.sqrt(sum));
    }
  }
  const avg = pairDistances.reduce((s, d) => s + d, 0) / pairDistances.length;
  return avg >= 0.018;
}

export function hasStableFacePosition(previousBox, currentBox) {
  if (!previousBox || !currentBox) return true;
  const centerA = {
    x: previousBox.x + previousBox.width / 2,
    y: previousBox.y + previousBox.height / 2,
  };
  const centerB = {
    x: currentBox.x + currentBox.width / 2,
    y: currentBox.y + currentBox.height / 2,
  };
  const centerDelta = distance(centerA, centerB);
  const sizeDelta = Math.abs(currentBox.width - previousBox.width);
  const referenceWidth = Math.max(previousBox.width, 1);
  return centerDelta <= referenceWidth * 0.16 && sizeDelta <= referenceWidth * 0.18;
}

export async function readBlinkMetric(video) {
  await loadFaceApiModels();
  const detection = await faceapi
    .detectSingleFace(video, DETECTOR_OPTIONS)
    .withFaceLandmarks();

  if (!detection) return null;
  return getBlinkMetric(detection.landmarks);
}

export async function captureFaceDescriptor(video) {
  await loadFaceApiModels();

  const detections = await faceapi
    .detectAllFaces(video, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) {
    throw new Error('No detectamos un rostro. Mira de frente a la camara.');
  }
  if (detections.length > 1) {
    throw new Error('Solo debe aparecer una persona en la camara.');
  }

  const canvas = captureCanvas(video);
  const brightness = estimateBrightness(canvas);
  const [detection] = detections;
  validateQuality(detection, video, brightness);

  return {
    imageDataUrl: canvas.toDataURL('image/jpeg', 0.88),
    descriptor: Array.from(detection.descriptor, (value) => Number(value.toFixed(6))),
    box: {
      x: detection.detection.box.x,
      y: detection.detection.box.y,
      width: detection.detection.box.width,
      height: detection.detection.box.height,
    },
    brightness,
  };
}
