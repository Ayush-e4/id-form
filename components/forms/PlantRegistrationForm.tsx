"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import { PlantConfig } from "@/lib/plants";

type Step = "form" | "uploading" | "success";
const MAX_TEXT_LENGTH = 50;
const PhotoCropModal = dynamic(() => import("@/components/forms/PhotoCropModal"), {
  ssr: false,
});

export default function PlantRegistrationForm({ plant }: { plant: PlantConfig }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  function replacePhotoPreview(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setPhotoPreview(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setPhotoPreview(nextUrl);
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrMsg("");
    setCropSourceFile(file);
  }

  async function handleCropConfirm(croppedFile: File) {
    try {
      setPhotoFile(croppedFile);
      replacePhotoPreview(croppedFile);
      setCropSourceFile(null);
      setErrMsg("");
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to prepare the image. Please try another one.");
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) setPhone(val);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setErrMsg("Please enter your name.");
      return;
    }
    if (name.trim().length > MAX_TEXT_LENGTH) {
      setErrMsg("Name cannot be more than 50 characters.");
      return;
    }
    if (phone.length !== 10) {
      setErrMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!photoFile) {
      setErrMsg("Please upload or take a photo.");
      return;
    }

    setErrMsg("");
    setStep("uploading");

    try {
      const presignRes = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: photoFile.name,
          contentType: photoFile.type,
        }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, token, key } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": photoFile.type,
          Authorization: `Bearer ${token}`,
        },
        body: photoFile,
      });
      if (!uploadRes.ok) throw new Error("Photo upload failed");

      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          photoKey: key,
          type: "plant",
          plantSlug: plant.slug,
          plantName: plant.name,
        }),
      });
      if (!submitRes.ok) {
        const data = await submitRes.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }

      setStep("success");
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong. Please try again.");
      setStep("form");
    }
  }

  function reset() {
    setName("");
    setPhone("");
    setPhotoFile(null);
    replacePhotoPreview(null);
    setErrMsg("");
    setStep("form");
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  if (step === "success") {
    return (
      <main className={styles.main}>
        <div className={styles.successWrap}>
          <div className={styles.tick}>✓</div>
          <h2 className={styles.successTitle}>{plant.successTitle || "All done!"}</h2>
          <p className={styles.successSub}>{plant.successMessage || "Your details have been saved successfully."}</p>
          <button className={styles.resetBtn} onClick={reset}>
            Submit another entry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{plant.title}</h1>
        <p className={styles.sub}>{plant.subtitle}</p>
      </header>

      <div className={styles.body}>
        <PhotoCropModal
          file={cropSourceFile}
          isOpen={Boolean(cropSourceFile)}
          onCancel={() => setCropSourceFile(null)}
          onConfirm={handleCropConfirm}
        />

        <div className={styles.photoZone}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            style={{ display: "none" }}
          />
          {photoPreview ? (
            <div style={{ width: "100%", height: "100%", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
              <div className={styles.changeOverlay}>Tap to change photo</div>
            </div>
          ) : (
            <div className={styles.photoDualActions}>
              <button className={styles.photoActionBtn} type="button" onClick={() => fileRef.current?.click()}>
                <span className={styles.photoActionIcon}>🖼️</span>
                Gallery
              </button>
              <button className={styles.photoActionBtn} type="button" onClick={() => cameraRef.current?.click()}>
                <span className={styles.photoActionIcon}>📷</span>
                Camera
              </button>
            </div>
          )}
        </div>

        <p className={styles.photoHelpText}>
          Use a chest-up photo. We will auto-center the face when supported, and you can adjust it before upload.
        </p>

        <div className={styles.field}>
          <label className={styles.label}>FULL NAME</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_TEXT_LENGTH))}
            maxLength={MAX_TEXT_LENGTH}
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>PHONE NUMBER</label>
          <input
            className={styles.input}
            type="tel"
            placeholder="Enter 10 digit phone"
            value={phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
          />
        </div>

        {errMsg && <p className={styles.error} aria-live="polite">{errMsg}</p>}

        <button
          className={`${styles.submitBtn} ${step === "uploading" ? styles.submitBtnLoading : ""}`}
          onClick={handleSubmit}
          disabled={step === "uploading"}
        >
          {step === "uploading" ? (
            <>
              <div className={styles.spinner}></div>
              <span>Submitting…</span>
            </>
          ) : (
            "Submit →"
          )}
        </button>
      </div>
    </main>
  );
}
