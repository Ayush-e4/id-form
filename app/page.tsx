"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import styles from "./page.module.css";

type Step = "form" | "uploading" | "success" | "error";

export default function FormPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
    if (!file) return;

    replacePhotoPreview(file);

    try {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setPhotoFile(compressedFile);
      replacePhotoPreview(compressedFile);
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to compress the image. Please try another one.");
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only digits
    if (val.length <= 10) setPhone(val);
  };

  async function handleSubmit() {
    if (!name.trim()) {
      setErrMsg("Please enter your name.");
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
      let photoKey: string | null = null;

      // 1. Upload photo to R2 via presigned URL if provided
      if (photoFile) {
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
            "Authorization": `Bearer ${token}`
          },
          body: photoFile,
        });
        if (!uploadRes.ok) throw new Error("Photo upload failed");
        photoKey = key;
      }

      // 2. Save submission
      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          phone: phone.trim(), 
          photoKey,
          type: "plant" 
        }),
      });
      if (!submitRes.ok) throw new Error("Submission failed");

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
          <h2 className={styles.successTitle}>All done!</h2>
          <p className={styles.successSub}>Your details have been saved successfully.</p>
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
        <h1 className={styles.title}>ID Card</h1>
        <p className={styles.sub}>Fill in your details below</p>
      </header>

      <div className={styles.body}>
        {/* Photo upload */}
        <div className={styles.photoZone}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            style={{ display: "none" }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            style={{ display: "none" }}
          />
          {photoPreview ? (
            <div style={{ width: '100%', height: '100%', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
              <div className={styles.changeOverlay}>Click to change photo</div>
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

        {/* Name */}
        <div className={styles.field}>
          <label className={styles.label}>FULL NAME</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        {/* Phone */}
        <div className={styles.field}>
          <label className={styles.label}>PHONE NUMBER</label>
          <input
            className={styles.input}
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
        </div>

        {errMsg && <p className={styles.error}>{errMsg}</p>}

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
