import Link from "next/link";
import { ArrowLeft, ClipboardList, Sparkles } from "lucide-react";

export function AppShell(props: {
  title: string;
  description?: string;
  /** e.g. back to dashboard from Settings */
  backLink?: { href: string; label: string };
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 group-hover:border-primary/50 group-hover:glow-shadow transition-all duration-300">
                  <Sparkles suppressHydrationWarning className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Findmejob.ai
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/pipeline"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Find Jobs
                </Link>
                <Link
                  href="/pipeline"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <ClipboardList suppressHydrationWarning className="w-4 h-4" /> My Applications
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {props.right}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {props.backLink ? (
                <Link
                  href={props.backLink.href}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                  {props.backLink.label}
                </Link>
              ) : null}
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{props.title}</h1>
              {props.description ? (
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{props.description}</p>
              ) : null}
            </div>
            <div className="hidden sm:block"></div>
          </div>
        </div>

        {props.children}
      </main>
    </div>
  );
}