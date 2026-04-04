import { NextRequest, NextResponse } from "next/server";
import { appendSubmission } from "@/lib/submissions";
import { supabase, BUCKET } from "@/lib/supabase";
import { Submission } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, photoKey, type = "plant" } = body;

    if (!name || (!phone && type === "plant")) {
      return NextResponse.json(
        { error: "name and phone are required" },
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
      name: name.trim(),
      phone: (phone || "").trim(),
      photoUrl,
      submittedAt: new Date().toISOString(),
      type,
      // School specific fields
      fathersName: body.fathersName,
      mothersName: body.mothersName,
      class: body.class,
      dob: body.dob,
      address: body.address,
      rollNo: body.rollNo,
      admissionNo: body.admissionNo,
      height: body.height,
      weight: body.weight,
      bloodGroup: body.bloodGroup,
      houseName: body.houseName,
    };

    await appendSubmission(entry);

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
