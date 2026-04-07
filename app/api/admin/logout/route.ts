import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { jsonNoStore } from "@/lib/http";

export async function POST() {
  const response = jsonNoStore({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
