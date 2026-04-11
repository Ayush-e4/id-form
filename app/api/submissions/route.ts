import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { jsonNoStore } from "@/lib/http";
import { readSubmissionsPage } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isValidAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const routeSlug = searchParams.get("route") || "all";
    const all = searchParams.get("mode") === "all";
    const data = await readSubmissionsPage({
      page,
      pageSize,
      search,
      routeSlug,
      all,
    });
    return jsonNoStore(data);
  } catch (err) {
    console.error("[submissions]", err);
    return jsonNoStore({ error: "Failed to load submissions" }, { status: 500 });
  }
}
