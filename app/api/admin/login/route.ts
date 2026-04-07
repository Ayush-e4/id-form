import { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  isAdminSessionSecretConfigured,
  validateAdminPassword,
} from "@/lib/admin-auth";
import { jsonNoStore } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!isAdminPasswordConfigured()) {
      return jsonNoStore({ error: "Admin password is not configured" }, { status: 500 });
    }

    if (process.env.NODE_ENV === "production" && !isAdminSessionSecretConfigured()) {
      return jsonNoStore({ error: "Admin session secret is not configured" }, { status: 500 });
    }

    if (typeof password !== "string" || !validateAdminPassword(password)) {
      return jsonNoStore({ error: "Invalid password" }, { status: 401 });
    }

    const response = jsonNoStore({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), adminSessionCookieOptions);
    return response;
  } catch (err) {
    console.error("[admin-login]", err);
    return jsonNoStore({ error: "Login failed" }, { status: 500 });
  }
}
