"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, Sparkles } from "lucide-react";
import { Suspense } from "react";

function GateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
      } else {
        setError("Incorrect password. Try again.");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          autoComplete="current-password"
          disabled={loading}
          className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
        />
        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_oklch(0.68_0.18_260)] hover:shadow-[0_0_25px_-5px_oklch(0.68_0.18_260)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Enter"
        )}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent)]" />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 glow-shadow">
            <Sparkles className="w-4 h-4" />
            findmejob.ai
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Private Access</h1>
          <p className="text-sm text-muted-foreground">Enter the password to continue</p>
        </div>

        {/* Card */}
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-xl">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          }>
            <GateForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
