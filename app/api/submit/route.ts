import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { appendSubmission } from "@/lib/submissions";
import { jsonNoStore } from "@/lib/http";
import { supabase, BUCKET } from "@/lib/supabase";
import { Submission } from "@/lib/types";
import { getPlantConfig } from "@/lib/plants";
import { getEnabledFieldMap, getSchoolConfig } from "@/lib/schools";

const BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const MAX_TEXT_LENGTH = 50;
const MAX_ADDRESS_LENGTH = 200;
const MAX_HOUSE_LENGTH = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PHOTO_KEY_PATTERN = /^[a-zA-Z0-9/_\-.]+$/;
const SCHOOL_FIELD_KEYS = [
  "fathersName",
  "mothersName",
  "class",
  "section",
  "dob",
  "address",
  "rollNo",
  "admissionNo",
  "height",
  "weight",
  "bloodGroup",
  "houseName",
] as const;

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, maxLength);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, photoKey, type = "plant" } = body;
    const trimmedName = trimString(name, MAX_TEXT_LENGTH);
    const normalizedPhone = typeof phone === "string" ? phone.replace(/\D/g, "").trim() : "";
    const normalizedPhotoKey = trimString(photoKey, 255) ?? null;
    const plantSlug = trimString(body.plantSlug, MAX_TEXT_LENGTH);
    const plantName = trimString(body.plantName, MAX_TEXT_LENGTH);
    const schoolSlug = trimString(body.schoolSlug, MAX_TEXT_LENGTH);
    const schoolName = trimString(body.schoolName, MAX_TEXT_LENGTH);
    const plantConfig = type === "plant" && plantSlug ? getPlantConfig(plantSlug) : undefined;
    const schoolConfig = type === "school" && schoolSlug ? getSchoolConfig(schoolSlug) : undefined;

    if (!trimmedName || !normalizedPhone) {
      return jsonNoStore(
        { error: "name and phone are required" },
        { status: 400 }
      );
    }
    if (normalizedPhone && normalizedPhone.length !== 10) {
      return jsonNoStore(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (type !== "plant" && type !== "school") {
      return jsonNoStore(
        { error: "Invalid submission type" },
        { status: 400 }
      );
    }

    if (normalizedPhotoKey && !PHOTO_KEY_PATTERN.test(normalizedPhotoKey)) {
      return jsonNoStore(
        { error: "Invalid photo key" },
        { status: 400 }
      );
    }

    if (type === "plant") {
      if (!plantSlug || !plantConfig) {
        return jsonNoStore(
          { error: "A valid plant route is required for plant submissions" },
          { status: 400 }
        );
      }
    }

    if (type === "school") {
      if (!schoolSlug || !schoolConfig) {
        return jsonNoStore(
          { error: "A valid school route is required for school submissions" },
          { status: 400 }
        );
      }

      const enabledFieldMap = getEnabledFieldMap(schoolConfig);
      for (const field of schoolConfig.fields) {
        if (!field.required) continue;

        const rawValue = body[field.key];
        const normalizedValue =
          field.key === "phone"
            ? (typeof rawValue === "string" ? rawValue.replace(/\D/g, "").trim() : "")
            : trimString(rawValue, field.key === "address" ? MAX_ADDRESS_LENGTH : MAX_TEXT_LENGTH);

        if (!normalizedValue) {
          return jsonNoStore(
            { error: `${field.key} is required for ${schoolConfig.name}` },
            { status: 400 }
          );
        }
      }

      for (const key of SCHOOL_FIELD_KEYS) {
        if (!enabledFieldMap.has(key) && body[key]) {
          body[key] = "";
        }
      }
    }

    const height = body.height === "" || body.height == null ? undefined : Number(body.height);
    const weight = body.weight === "" || body.weight == null ? undefined : Number(body.weight);

    if (height !== undefined && (Number.isNaN(height) || height < 50 || height > 300)) {
      return jsonNoStore(
        { error: "Height must be between 50 cm and 300 cm" },
        { status: 400 }
      );
    }

    if (weight !== undefined && (Number.isNaN(weight) || weight < 10 || weight > 200)) {
      return jsonNoStore(
        { error: "Weight must be between 10 kg and 200 kg" },
        { status: 400 }
      );
    }

    const bloodGroup = trimString(body.bloodGroup, MAX_TEXT_LENGTH);
    if (bloodGroup && !BLOOD_GROUPS.has(bloodGroup)) {
      return jsonNoStore(
        { error: "Please select a valid blood group" },
        { status: 400 }
      );
    }

    const dob = trimString(body.dob, MAX_TEXT_LENGTH);
    if (dob && !DATE_PATTERN.test(dob)) {
      return jsonNoStore(
        { error: "Date of birth must use YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    let photoUrl = null;
    if (normalizedPhotoKey) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalizedPhotoKey);
      photoUrl = data.publicUrl;
    }

    const entry: Submission = {
      id: randomUUID(),
      name: trimmedName,
      phone: normalizedPhone,
      photoUrl,
      photoKey: normalizedPhotoKey,
      submittedAt: new Date().toISOString(),
      type,
      plantSlug,
      plantName: plantConfig?.name || plantName,
      schoolSlug,
      schoolName: schoolConfig?.name || schoolName,
      // School specific fields
      fathersName: trimString(body.fathersName, MAX_TEXT_LENGTH),
      mothersName: trimString(body.mothersName, MAX_TEXT_LENGTH),
      class: trimString(body.class, MAX_TEXT_LENGTH),
      dob,
      address: trimString(body.address, MAX_ADDRESS_LENGTH),
      rollNo: trimString(body.rollNo, MAX_TEXT_LENGTH),
      admissionNo: trimString(body.admissionNo, MAX_TEXT_LENGTH),
      height: height?.toString(),
      weight: weight?.toString(),
      bloodGroup,
      houseName: trimString(body.houseName, MAX_HOUSE_LENGTH),
      section: trimString(body.section, MAX_TEXT_LENGTH),
    };

    await appendSubmission(entry);

    return jsonNoStore({ ok: true, id: entry.id });
  } catch (err) {
    console.error("[submit]", err);
    return jsonNoStore({ error: "Submission failed" }, { status: 500 });
  }
}
