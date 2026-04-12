"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  BarChart2,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/scan", label: "Find Jobs", icon: Search },
  { href: "/pipeline", label: "Pipeline", icon: ClipboardList },
  { href: "/patterns", label: "Patterns", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-stretch justify-around h-16 sm:h-18 md:justify-start md:gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl
                  flex-1 md:flex-none md:min-w-[110px] md:flex-row md:gap-2 md:px-4 md:py-3
                  text-xs md:text-sm font-medium transition-all duration-200
                  ${active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 md:w-4 md:h-4 shrink-0 transition-all duration-200 ${active ? "scale-110" : ""}`}
                  strokeWidth={active ? 2.5 : 1.8}
                  aria-hidden
                />
                <span className="leading-none">{label}</span>
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary md:hidden" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
