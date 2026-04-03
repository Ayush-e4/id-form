import { NextRequest, NextResponse } from "next/server";
import { appendSubmission } from "@/lib/submissions";
import { supabase, BUCKET } from "@/lib/supabase";
import { Submission } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, photoKey } = await req.json();

    if (!name || !phone) {
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
      phone: phone.trim(),
      photoUrl,
      submittedAt: new Date().toISOString(),
    };

    await appendSubmission(entry);

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
