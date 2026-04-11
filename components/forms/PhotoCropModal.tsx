"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import styles from "@/app/page.module.css";
import { createCroppedImageFile, CropArea, detectSuggestedCrop, PHOTO_CROP_ASPECT } from "@/lib/photo-crop";

interface PhotoCropModalProps {
  file: File | null;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}

export default function PhotoCropModal({ file, isOpen, onCancel, onConfirm }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [initialArea, setInitialArea] = useState<CropArea | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [helperText, setHelperText] = useState("Adjust the photo so the face fits well in the frame.");
  const [sessionKey, setSessionKey] = useState(0);

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!isOpen || !file) return;

    let isActive = true;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setInitialArea(null);
    setHelperText("Adjust the photo so the face fits well in the frame.");
    setIsAnalyzing(true);

    detectSuggestedCrop(file)
      .then((suggestion) => {
        if (!isActive) return;

        setInitialArea(suggestion.initialArea);
        setHelperText(suggestion.message);
        setSessionKey((current) => current + 1);
      })
      .finally(() => {
        if (isActive) {
          setIsAnalyzing(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [file, isOpen]);

  async function handleSave() {
    if (!file || !imageUrl || !croppedAreaPixels) {
      return;
    }

    setIsSaving(true);
    try {
      const croppedFile = await createCroppedImageFile(imageUrl, croppedAreaPixels, file);
      await onConfirm(croppedFile);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen || !file || !imageUrl) {
    return null;
  }

  return (
    <div className={styles.cropModalBackdrop} onClick={() => !isSaving && onCancel()}>
      <div className={styles.cropModalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.cropModalHeader}>
          <div>
            <h2 className={styles.cropModalTitle}>Adjust Photo</h2>
            <p className={styles.cropModalText}>{helperText}</p>
          </div>
        </div>

        <div className={styles.cropFrameWrap}>
          {isAnalyzing && (
            <div className={styles.cropLoadingOverlay}>
              <span className={styles.spinner}></span>
              <span>Finding face position...</span>
            </div>
          )}

          <Cropper
            key={`${file.name}-${file.lastModified}-${sessionKey}`}
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={PHOTO_CROP_ASPECT}
            minZoom={1}
            maxZoom={3}
            objectFit="contain"
            showGrid={false}
            cropShape="rect"
            initialCroppedAreaPercentages={initialArea ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_: Area, pixels: Area) => setCroppedAreaPixels(pixels)}
          />
          <div className={styles.cropGuide}>
            <span className={styles.cropGuideLabel}>Keep face centered and shoulders visible</span>
          </div>
        </div>

        <div className={styles.cropControls}>
          <label className={styles.cropSliderLabel}>
            <span>Zoom</span>
            <input
              className={styles.cropSlider}
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </div>

        <div className={styles.cropActions}>
          <button type="button" className={styles.cropGhostBtn} onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className={styles.cropSaveBtn} onClick={handleSave} disabled={isSaving || !croppedAreaPixels}>
            {isSaving ? "Saving..." : "Use This Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
