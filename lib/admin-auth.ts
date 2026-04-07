import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "burman_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;
const CLOCK_SKEW_MS = 30 * 1000;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export function isAdminSessionSecretConfigured() {
  return Boolean(process.env.ADMIN_SESSION_SECRET);
}

export function validateAdminPassword(password: string) {
  const expectedPassword = getAdminPassword();
  return Boolean(expectedPassword) && safeEqual(password, expectedPassword);
}

export function createAdminSessionToken() {
  const payload = JSON.stringify({
    scope: "admin",
    issuedAt: Date.now(),
  });
  const encodedPayload = toBase64Url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function isValidAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return false;

  const expectedSignature = sign(encodedPayload);
  if (!safeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as {
      scope?: string;
      issuedAt?: number;
    };

    if (payload.scope !== "admin" || typeof payload.issuedAt !== "number") {
      return false;
    }

    const now = Date.now();
    if (payload.issuedAt > now + CLOCK_SKEW_MS) {
      return false;
    }

    return now - payload.issuedAt <= ADMIN_SESSION_TTL_MS;
  } catch {
    return false;
  }
}

export async function isAdminSessionAuthenticated() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_TTL_SECONDS,
};
