"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "careerPortal.tenantEmail";

export function getStoredTenantEmail(): string {
  if (typeof window === "undefined") return "builder@sidequestapp.com";
  return (
    window.localStorage.getItem(STORAGE_KEY) || "builder@sidequestapp.com"
  )
    .trim()
    .toLowerCase();
}

export function setStoredTenantEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
}

export function useTenantEmail() {
  const [tenantEmail, _setTenantEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "builder@sidequestapp.com";
    return getStoredTenantEmail();
  });

  const setTenantEmail = useCallback((email: string) => {
    const next = email.trim().toLowerCase() || "builder@sidequestapp.com";
    _setTenantEmail(next);
    setStoredTenantEmail(next);
  }, []);

  return { tenantEmail, setTenantEmail };
}