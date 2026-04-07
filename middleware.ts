import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isSensitivePath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/");
}

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");

  if (isSensitivePath(req.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
