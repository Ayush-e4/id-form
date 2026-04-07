import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { jsonNoStore } from "@/lib/http";
import { supabase, BUCKET } from "@/lib/supabase";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return jsonNoStore({ error: "Missing filename or type" }, { status: 400 });
    }

    if (typeof filename !== "string" || filename.length > 120) {
      return jsonNoStore({ error: "Invalid filename" }, { status: 400 });
    }

    if (typeof contentType !== "string" || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return jsonNoStore({ error: "Unsupported file type" }, { status: 400 });
    }

    const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const key = `uploads/${monthPrefix}/${randomUUID()}-${safe}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(key);

    if (error || !data) throw error;

    return jsonNoStore({ uploadUrl: data.signedUrl, token: data.token, key });
  } catch (err) {
    console.error("[presign]", err);
    return jsonNoStore({ error: "Failed to generate URL" }, { status: 500 });
  }
}
