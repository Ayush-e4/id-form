import { NextRequest, NextResponse } from "next/server";
import { appendSubmission } from "@/lib/submissions";
import { supabase, BUCKET } from "@/lib/supabase";
import { Submission } from "@/lib/types";

const BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const MAX_TEXT_LENGTH = 50;
const MAX_ADDRESS_LENGTH = 200;
const MAX_HOUSE_LENGTH = 20;

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

    if (!trimmedName || !normalizedPhone) {
      return NextResponse.json(
        { error: "name and phone are required" },
        { status: 400 }
      );
    }
    if (normalizedPhone && normalizedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    const height = body.height === "" || body.height == null ? undefined : Number(body.height);
    const weight = body.weight === "" || body.weight == null ? undefined : Number(body.weight);

    if (height !== undefined && (Number.isNaN(height) || height < 50 || height > 300)) {
      return NextResponse.json(
        { error: "Height must be between 50 cm and 300 cm" },
        { status: 400 }
      );
    }

    if (weight !== undefined && (Number.isNaN(weight) || weight < 10 || weight > 200)) {
      return NextResponse.json(
        { error: "Weight must be between 10 kg and 200 kg" },
        { status: 400 }
      );
    }

    const bloodGroup = trimString(body.bloodGroup, MAX_TEXT_LENGTH);
    if (bloodGroup && !BLOOD_GROUPS.has(bloodGroup)) {
      return NextResponse.json(
        { error: "Please select a valid blood group" },
        { status: 400 }
      );
    }

    let photoUrl = null;
    if (photoKey) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(photoKey);
      photoUrl = data.publicUrl;
    }

    const entry: Submission = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      phone: normalizedPhone,
      photoUrl,
      submittedAt: new Date().toISOString(),
      type,
      // School specific fields
      fathersName: trimString(body.fathersName, MAX_TEXT_LENGTH),
      mothersName: trimString(body.mothersName, MAX_TEXT_LENGTH),
      class: trimString(body.class, MAX_TEXT_LENGTH),
      dob: trimString(body.dob, MAX_TEXT_LENGTH),
      address: trimString(body.address, MAX_ADDRESS_LENGTH),
      rollNo: trimString(body.rollNo, MAX_TEXT_LENGTH),
      admissionNo: trimString(body.admissionNo, MAX_TEXT_LENGTH),
      height: height?.toString(),
      weight: weight?.toString(),
      bloodGroup,
      houseName: trimString(body.houseName, MAX_HOUSE_LENGTH),
    };

    await appendSubmission(entry);

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
