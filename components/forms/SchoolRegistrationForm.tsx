"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";
import {
  BLOOD_GROUP_OPTIONS,
  SchoolConfig,
  SchoolFieldConfig,
  SchoolFieldKey,
} from "@/lib/schools";

type Step = "form" | "uploading" | "success";
const PhotoCropModal = dynamic(() => import("@/components/forms/PhotoCropModal"), {
  ssr: false,
});

const MAX_TEXT_LENGTH = 50;
const MAX_ADDRESS_LENGTH = 200;
const MAX_HOUSE_LENGTH = 20;
const MIN_HEIGHT = 50;
const MAX_HEIGHT = 300;
const MIN_WEIGHT = 10;
const MAX_WEIGHT = 200;

type FormDataState = Record<SchoolFieldKey, string>;

const INITIAL_FORM_DATA: FormDataState = {
  name: "",
  class: "",
  section: "",
  fathersName: "",
  mothersName: "",
  dob: "",
  address: "",
  phone: "",
  rollNo: "",
  admissionNo: "",
  height: "",
  weight: "",
  bloodGroup: "",
  houseName: "",
};

const FIELD_LABELS: Record<SchoolFieldKey, string> = {
  name: "Student Name",
  class: "Class",
  section: "Section",
  fathersName: "Father's Name",
  mothersName: "Mother's Name",
  dob: "Date of Birth",
  address: "Address",
  phone: "Mobile",
  rollNo: "Roll No",
  admissionNo: "Admission No",
  height: "Height",
  weight: "Weight",
  bloodGroup: "Blood Group",
  houseName: "House Name",
};

export default function SchoolRegistrationForm({ school }: { school: SchoolConfig }) {
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_DATA);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as SchoolFieldKey;
    let nextValue = value;

    if (fieldName === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (fieldName === "address") {
      nextValue = value.slice(0, MAX_ADDRESS_LENGTH);
    } else if (fieldName === "houseName") {
      nextValue = value.slice(0, MAX_HOUSE_LENGTH);
    } else if (fieldName === "height" || fieldName === "weight") {
      nextValue = value.replace(/[^\d.]/g, "").slice(0, 6);
    } else {
      nextValue = value.slice(0, MAX_TEXT_LENGTH);
    }

    setFormData((prev) => ({ ...prev, [fieldName]: nextValue }));
  };

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
      setShowPhotoActions(false);
      setErrMsg("");
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to prepare the image. Please try another one.");
    }
  }

  function validateField(field: SchoolFieldConfig) {
    const value = formData[field.key].trim();

    if (field.required && !value) {
      return `Please enter ${FIELD_LABELS[field.key].toLowerCase()}.`;
    }

    if (field.key === "phone" && value && value.length !== 10) {
      return "Phone number must be exactly 10 digits.";
    }

    if (field.key === "height" && value) {
      const height = Number(value);
      if (Number.isNaN(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
        return "Height must be between 50 cm and 300 cm.";
      }
    }

    if (field.key === "weight" && value) {
      const weight = Number(value);
      if (Number.isNaN(weight) || weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
        return "Weight must be between 10 kg and 200 kg.";
      }
    }

    if (field.key === "bloodGroup" && value && !BLOOD_GROUP_OPTIONS.includes(value as (typeof BLOOD_GROUP_OPTIONS)[number])) {
      return "Please select a valid blood group.";
    }

    return null;
  }

  async function handleSubmit() {
    for (const field of school.fields) {
      const error = validateField(field);
      if (error) {
        setErrMsg(error);
        return;
      }
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

      const enabledKeys = new Set(school.fields.map((field) => field.key));
      const payload = Object.fromEntries(
        Object.entries(formData).map(([fieldKey, value]) => [
          fieldKey,
          enabledKeys.has(fieldKey as SchoolFieldKey) ? value : "",
        ])
      );

      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          photoKey: key,
          type: "school",
          schoolSlug: school.slug,
          schoolName: school.name,
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
    setFormData(INITIAL_FORM_DATA);
    setPhotoFile(null);
    replacePhotoPreview(null);
    setShowPhotoActions(false);
    setErrMsg("");
    setStep("form");
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function renderField(field: SchoolFieldConfig) {
    const commonProps = {
      className: styles.input,
      name: field.key,
      value: formData[field.key],
      onChange: handleInputChange,
      placeholder: field.placeholder,
    };

    const widthClass =
      field.width === "third"
        ? styles.schoolGridItemThird
        : field.width === "half"
          ? styles.schoolGridItemHalf
          : styles.schoolGridItemFull;

    return (
      <div
        key={field.key}
        className={`${styles.field} ${widthClass} ${field.key === "bloodGroup" ? styles.bloodGroupField : ""}`}
      >
        <label className={styles.label}>
          {FIELD_LABELS[field.key]}
          {field.required ? " *" : ""}
        </label>
        {field.key === "dob" ? (
          <input {...commonProps} type="date" />
        ) : field.key === "phone" ? (
          <input {...commonProps} type="tel" inputMode="numeric" maxLength={10} />
        ) : field.key === "height" || field.key === "weight" ? (
          <input
            {...commonProps}
            type="number"
            inputMode="decimal"
            min={field.key === "height" ? MIN_HEIGHT : MIN_WEIGHT}
            max={field.key === "height" ? MAX_HEIGHT : MAX_WEIGHT}
            step="0.1"
          />
        ) : field.key === "bloodGroup" ? (
          <select {...commonProps}>
            <option value="">Select blood group</option>
            {BLOOD_GROUP_OPTIONS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        ) : (
          <input {...commonProps} type="text" maxLength={field.key === "address" ? MAX_ADDRESS_LENGTH : MAX_TEXT_LENGTH} />
        )}
      </div>
    );
  }

  if (step === "success") {
    return (
      <main className={styles.main}>
        <div className={styles.successWrap}>
          <div className={styles.tick}>✓</div>
          <h2 className={styles.successTitle}>{school.successTitle || "Submitted!"}</h2>
          <p className={styles.successSub}>
            {school.successMessage || `${school.name} details have been saved successfully.`}
          </p>
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
        <h1 className={styles.title}>{school.name}</h1>
        <p className={styles.sub}>{school.subtitle}</p>
      </header>

      <div className={`${styles.body} ${styles.schoolBody}`}>
        <PhotoCropModal
          file={cropSourceFile}
          isOpen={Boolean(cropSourceFile)}
          onCancel={() => setCropSourceFile(null)}
          onConfirm={handleCropConfirm}
        />

        <div className={styles.photoPickerWrap}>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className={styles.photoPickerButton}
            onClick={() => setShowPhotoActions((current) => !current)}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className={styles.photoPickerPreview} />
            ) : (
              <span className={styles.photoPickerGlyph}>👤</span>
            )}
            <span className={styles.photoPickerBadge}>+</span>
          </button>
          <p className={styles.photoPickerHint}>
            Tap the profile icon to choose a photo
          </p>
          <p className={styles.photoHelpText}>
            Use a chest-up photo. We will auto-center the face when supported, and you can adjust it before upload.
          </p>
          {showPhotoActions && (
            <div className={styles.photoActionSheet}>
              <button className={styles.photoActionChip} type="button" onClick={() => fileRef.current?.click()}>
                Gallery
              </button>
              <button className={styles.photoActionChip} type="button" onClick={() => cameraRef.current?.click()}>
                Camera
              </button>
            </div>
          )}
        </div>

        <div className={styles.schoolGrid}>{school.fields.map(renderField)}</div>

        {errMsg && <p className={styles.error} aria-live="polite">{errMsg}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={step === "uploading"}>
          {step === "uploading" ? (
            <span className={styles.submitBtnLoading}>
              <span className={styles.spinner}></span>
              Submitting...
            </span>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </main>
  );
}
