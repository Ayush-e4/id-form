import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { jsonNoStore } from "@/lib/http";
import { readSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isValidAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await readSubmissions();
    return jsonNoStore(data);
  } catch (err) {
    console.error("[submissions]", err);
    return jsonNoStore({ error: "Failed to load submissions" }, { status: 500 });
  }
}
