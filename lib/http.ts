import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);

  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(key, value);
  }

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}
