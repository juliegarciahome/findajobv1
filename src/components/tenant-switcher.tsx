"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTenantEmail } from "@/lib/client-tenant";
import { LogOut, ChevronDown } from "lucide-react";

export function UserMenu() {
  const { data: session } = useSession();
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seed tenant from Google session email
  useEffect(() => {
    if (session?.user?.email) {
      setTenantEmail(session.user.email);
    }
  }, [session?.user?.email, setTenantEmail]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayEmail = session?.user?.email ?? tenantEmail;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-border transition-all text-sm text-foreground/80 hover:text-foreground"
      >
        <span className="max-w-[220px] truncate">{displayEmail}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-border/50 bg-background shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use UserMenu instead */
export function TenantSwitcher(_props: { tenantEmail: string; setTenantEmail: (v: string) => void }) {
  return <UserMenu />;
}
