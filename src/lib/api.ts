"use client";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit & { tenantEmail?: string }) {
  const tenantEmail = init?.tenantEmail;
  const headers = new Headers(init?.headers);
  if (tenantEmail) headers.set("x-user-email", tenantEmail);
  return fetch(input, { ...init, headers });
}