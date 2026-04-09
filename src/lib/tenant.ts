import type { NextRequest } from "next/server";

export function getTenantEmail(req: NextRequest): string {
  // Simple multi-tenant selector for MVP/dev:
  // client includes X-User-Email header; defaults to demo user.
  return (
    req.headers.get("x-user-email")?.trim().toLowerCase() ||
    "builder@sidequestapp.com"
  );
}
