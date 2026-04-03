import { NextRequest, NextResponse } from "next/server";
import { supabase, BUCKET } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or type" }, { status: 400 });
    }

    const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `${Date.now()}-${safe}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(key);

    if (error || !data) throw error;

    return NextResponse.json({ uploadUrl: data.signedUrl, token: data.token, key });
  } catch (err) {
    console.error("[presign]", err);
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
