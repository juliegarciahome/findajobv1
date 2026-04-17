"use client";

import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function GetStartedButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If already signed in, clicking goes straight to pipeline
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // Already signed in — nothing to do, just let the button navigate
    }
  }, [status, session]);

  function handleClick() {
    if (status === "authenticated") {
      router.push("/pipeline");
    } else {
      void signIn("google", { callbackUrl: "/pipeline" });
    }
  }

  if (status === "loading") {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 bg-primary/50 text-primary-foreground rounded-2xl px-8 py-4 text-base font-semibold cursor-not-allowed"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl px-8 py-4 text-base font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_oklch(0.68_0.18_260)] hover:shadow-[0_0_25px_-5px_oklch(0.68_0.18_260)]"
    >
      {status === "authenticated" ? "Go to Pipeline" : "Get Started"}
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}
