"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import styles from "../page.module.css";

type Step = "form" | "uploading" | "success" | "error";

export default function SchoolFormPage() {
  const [formData, setFormData] = useState({
    name: "",
    fathersName: "",
    mothersName: "",
    class: "",
    dob: "",
    address: "",
    phone: "",
    rollNo: "",
    admissionNo: "",
    height: "",
    weight: "",
    bloodGroup: "",
    houseName: "",
  });
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only digits
    if (val.length <= 10) setFormData(prev => ({ ...prev, phone: val }));
  };

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

  async function handleSubmit() {
    if (!formData.name.trim()) {
      setErrMsg("Please enter student name.");
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

      // 1. Upload photo
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
          ...formData,
          photoKey,
          type: 'school'
        }),
      });
      if (!submitRes.ok) throw new Error("Submission failed");

      setStep("success");
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong. Please try again.");
      setStep("form");
    }
  }

  const reset = () => {
    setFormData({
      name: "",
      fathersName: "",
      mothersName: "",
      class: "",
      dob: "",
      address: "",
      phone: "",
      rollNo: "",
      admissionNo: "",
      height: "",
      weight: "",
      bloodGroup: "",
      houseName: "",
    });
    setPhotoFile(null);
    replacePhotoPreview(null);
    setErrMsg("");
    setStep("form");
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  if (step === "success") {
    return (
      <main className={styles.main}>
        <div className={styles.successWrap}>
          <div className={styles.tick}>✓</div>
          <h2 className={styles.successTitle}>Submitted!</h2>
          <p className={styles.successSub}>Student details have been saved successfully.</p>
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
        <h1 className={styles.title}>School ID Form</h1>
        <p className={styles.sub}>Student Registration</p>
      </header>

      <div className={styles.body} style={{ maxWidth: '600px' }}>
        <div className={styles.photoZone}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPhotoChange} style={{ display: "none" }} />
          {photoPreview ? (
            <div style={{ width: '100%', height: '100%', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
              <div className={styles.changeOverlay}>Click to change photo</div>
            </div>
          ) : (
            <div className={styles.photoDualActions}>
              <button className={styles.photoActionBtn} onClick={() => fileRef.current?.click()}>
                <span className={styles.photoActionIcon}>🖼️</span> Gallery
              </button>
              <button className={styles.photoActionBtn} onClick={() => cameraRef.current?.click()}>
                <span className={styles.photoActionIcon}>📷</span> Camera
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.field}>
            <label className={styles.label}>Student Name</label>
            <input className={styles.input} name="name" value={formData.name} onChange={handleInputChange} placeholder="Required" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Class</label>
            <input className={styles.input} name="class" value={formData.class} onChange={handleInputChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.field}>
            <label className={styles.label}>Father's Name</label>
            <input className={styles.input} name="fathersName" value={formData.fathersName} onChange={handleInputChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mother's Name</label>
            <input className={styles.input} name="mothersName" value={formData.mothersName} onChange={handleInputChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.field}>
            <label className={styles.label}>Date of Birth</label>
            <input className={styles.input} type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Mobile</label>
            <input className={styles.input} type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} />
          </div>
        </div>

        <div className={styles.field}>
            <label className={styles.label}>Address</label>
            <input className={styles.input} name="address" value={formData.address} onChange={handleInputChange} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.field}>
            <label className={styles.label}>Roll No</label>
            <input className={styles.input} name="rollNo" value={formData.rollNo} onChange={handleInputChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Admission No</label>
            <input className={styles.input} name="admissionNo" value={formData.admissionNo} onChange={handleInputChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div className={styles.field}>
            <label className={styles.label}>Height</label>
            <input className={styles.input} name="height" value={formData.height} onChange={handleInputChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Weight</label>
            <input className={styles.input} name="weight" value={formData.weight} onChange={handleInputChange} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Blood Group</label>
            <input className={styles.input} name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>House Name</label>
          <input className={styles.input} name="houseName" value={formData.houseName} onChange={handleInputChange} />
        </div>

        {errMsg && <p className={styles.error}>{errMsg}</p>}

        <button
          className={`${styles.submitBtn} ${step === "uploading" ? styles.submitBtnLoading : ""}`}
          onClick={handleSubmit}
          disabled={step === "uploading"}
        >
          {step === "uploading" ? (
            <><div className={styles.spinner}></div><span>Submitting…</span></>
          ) : (
            "Submit Student Details →"
          )}
        </button>
      </div>
    </main>
  );
}
