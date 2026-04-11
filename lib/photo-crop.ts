export const PHOTO_CROP_ASPECT = 3 / 4;

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropSuggestion {
  initialArea: CropArea | null;
  message: string;
  usedFaceDetection: boolean;
}

const FACE_DETECTED_MESSAGE = "Face centered automatically. Adjust if needed, then save the photo.";
const MANUAL_CROP_MESSAGE = "Adjust the photo so the face and shoulders fit nicely inside the frame.";
const FACE_HEIGHT_MULTIPLIER = 2.45;
const FACE_WIDTH_MULTIPLIER = 1.95;
const FACE_TOP_OFFSET_MULTIPLIER = 0.28;
const OUTPUT_MIME_TYPE = "image/jpeg";
const PREFERRED_MAX_OUTPUT_BYTES = 1024 * 1024;
const HARD_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_EXPORT_DIMENSION = 2200;
const INITIAL_EXPORT_QUALITY = 0.94;
const MIN_EXPORT_QUALITY = 0.8;
const QUALITY_STEP = 0.06;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundArea(area: CropArea) {
  return {
    x: Math.round(area.x),
    y: Math.round(area.y),
    width: Math.round(area.width),
    height: Math.round(area.height),
  };
}

function normalizeCropRect(x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number) {
  let nextWidth = width;
  let nextHeight = height;

  if (nextWidth > imageWidth) {
    nextWidth = imageWidth;
    nextHeight = nextWidth / PHOTO_CROP_ASPECT;
  }

  if (nextHeight > imageHeight) {
    nextHeight = imageHeight;
    nextWidth = nextHeight * PHOTO_CROP_ASPECT;
  }

  const nextX = clamp(x, 0, Math.max(0, imageWidth - nextWidth));
  const nextY = clamp(y, 0, Math.max(0, imageHeight - nextHeight));

  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
}

function getLargestFace(faces: Array<{ boundingBox?: { x?: number; y?: number; width?: number; height?: number } }>) {
  return faces
    .map((face) => {
      const box = face.boundingBox;
      return {
        x: box?.x ?? 0,
        y: box?.y ?? 0,
        width: box?.width ?? 0,
        height: box?.height ?? 0,
      };
    })
    .filter((box) => box.width > 0 && box.height > 0)
    .sort((left, right) => (right.width * right.height) - (left.width * left.height))[0];
}

function replaceFileExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName}.${extension}`;
}

function getScaledSize(width: number, height: number, maxDimension: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }

      reject(new Error("Failed to export the cropped photo."));
    }, mimeType, quality);
  });
}

function drawScaledCanvas(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to prepare image crop.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  return canvas;
}

async function exportCroppedPhoto(canvas: HTMLCanvasElement) {
  let workingCanvas = canvas;

  for (;;) {
    let candidateBlob: Blob | null = null;

    for (let quality = INITIAL_EXPORT_QUALITY; quality >= MIN_EXPORT_QUALITY; quality -= QUALITY_STEP) {
      const blob = await canvasToBlob(workingCanvas, OUTPUT_MIME_TYPE, quality);

      if (!candidateBlob || blob.size < candidateBlob.size) {
        candidateBlob = blob;
      }

      if (blob.size <= PREFERRED_MAX_OUTPUT_BYTES) {
        return blob;
      }
    }

    if (candidateBlob && candidateBlob.size <= HARD_MAX_OUTPUT_BYTES) {
      return candidateBlob;
    }

    const shrinkRatio = candidateBlob
      ? Math.sqrt(HARD_MAX_OUTPUT_BYTES / candidateBlob.size) * 0.96
      : 0.9;
    const nextWidth = Math.max(1, Math.floor(workingCanvas.width * shrinkRatio));
    const nextHeight = Math.max(1, Math.floor(workingCanvas.height * shrinkRatio));

    if (nextWidth === workingCanvas.width && nextHeight === workingCanvas.height) {
      if (candidateBlob) {
        return candidateBlob;
      }
      throw new Error("Failed to export the cropped photo.");
    }

    workingCanvas = drawScaledCanvas(workingCanvas, nextWidth, nextHeight);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

export async function detectSuggestedCrop(file: File): Promise<CropSuggestion> {
  if (typeof window === "undefined") {
    return {
      initialArea: null,
      message: MANUAL_CROP_MESSAGE,
      usedFaceDetection: false,
    };
  }

  const FaceDetectorCtor = (window as Window & { FaceDetector?: any }).FaceDetector;
  if (!FaceDetectorCtor || typeof createImageBitmap !== "function") {
    return {
      initialArea: null,
      message: MANUAL_CROP_MESSAGE,
      usedFaceDetection: false,
    };
  }

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    const detector = new FaceDetectorCtor({
      fastMode: true,
      maxDetectedFaces: 1,
    });

    const faces = await detector.detect(bitmap);
    const face = getLargestFace(faces);

    if (!face) {
      return {
        initialArea: null,
        message: MANUAL_CROP_MESSAGE,
        usedFaceDetection: false,
      };
    }

    const targetHeight = Math.max(
      face.height * FACE_HEIGHT_MULTIPLIER,
      (face.width * FACE_WIDTH_MULTIPLIER) / PHOTO_CROP_ASPECT
    );
    const targetWidth = targetHeight * PHOTO_CROP_ASPECT;
    const cropX = face.x + (face.width / 2) - (targetWidth / 2);
    const cropY = face.y - (face.height * FACE_TOP_OFFSET_MULTIPLIER);
    const normalized = normalizeCropRect(
      cropX,
      cropY,
      targetWidth,
      targetHeight,
      bitmap.width,
      bitmap.height
    );

    return {
      initialArea: {
        x: (normalized.x / bitmap.width) * 100,
        y: (normalized.y / bitmap.height) * 100,
        width: (normalized.width / bitmap.width) * 100,
        height: (normalized.height / bitmap.height) * 100,
      },
      message: FACE_DETECTED_MESSAGE,
      usedFaceDetection: true,
    };
  } catch (error) {
    console.warn("[photo-crop] face detection unavailable", error);
    return {
      initialArea: null,
      message: MANUAL_CROP_MESSAGE,
      usedFaceDetection: false,
    };
  } finally {
    if (bitmap) {
      bitmap.close();
    }
  }
}

export async function createCroppedImageFile(imageSrc: string, cropArea: CropArea, sourceFile: File) {
  const image = await loadImage(imageSrc);
  const roundedCrop = roundArea(cropArea);
  const outputSize = getScaledSize(roundedCrop.width, roundedCrop.height, MAX_EXPORT_DIMENSION);
  const canvas = document.createElement("canvas");

  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to prepare image crop.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    roundedCrop.x,
    roundedCrop.y,
    roundedCrop.width,
    roundedCrop.height,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  const blob = await exportCroppedPhoto(canvas);

  return new File([blob], replaceFileExtension(sourceFile.name, "jpg"), {
    type: OUTPUT_MIME_TYPE,
    lastModified: Date.now(),
  });
}
