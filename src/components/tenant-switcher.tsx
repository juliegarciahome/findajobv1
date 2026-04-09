"use client";

import { Input } from "@/components/ui/input";

export function TenantSwitcher(props: {
  tenantEmail: string;
  setTenantEmail: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground">Tenant</div>
      <Input
        className="h-8 w-64"
        placeholder="you@example.com"
        value={props.tenantEmail}
        onChange={(e) => props.setTenantEmail(e.target.value)}
      />
    </div>
  );
}