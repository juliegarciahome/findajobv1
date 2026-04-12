import { NextResponse } from "next/server";

/** Tenant-specific JSON must not be cached by browsers or Cloudflare edge. */
export function jsonNoStore(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  return NextResponse.json(data, { ...init, headers });
}
