"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import {
  BrainCircuit,
  Loader2,
  Upload,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const PAIN_POINTS = [
  {
    id: "black-hole",
    emoji: "🕳️",
    label: 'Throwing my resume into the "never hear back" black hole.',
  },
  {
    id: "forms",
    emoji: "😫",
    label: "Filling out the same application forms 100 times.",
  },
  {
    id: "tweaking",
    emoji: "⏳",
    label: "Wasting hours tweaking my resume to match a job.",
  },
];

const ANIMATION_MESSAGES = [
  { main: "Analyzing your resume…", sub: "Reading every line, skill, and achievement." },
  { main: "Identifying your strengths…", sub: "Mapping your experience to what employers want." },
  { main: "Searching for perfect matches…", sub: "Scanning thousands of live job postings for you." },
  { main: "Preparing tailored resume versions…", sub: "Customizing your resume for each top match." },
  { main: "Almost ready…", sub: "Putting the finishing touches on your profile." },
];

// Google Drive SVG icon
function GoogleDriveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27.5h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

// Dropbox SVG icon
function DropboxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 43 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0L0 8.12l8.5 6.87L21 7.25zm18 0L43 8.12l-8.5 6.87L22 7.25zM0 21.86l12.5 8.12L21 22.74l-12.5-7.75zM43 21.86L30.5 30l-8.5-7.26 12.5-7.75zM12.5 32.37L21 40l8.5-7.63-8.5-6.74z" fill="#0061ff"/>
    </svg>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            n === current
              ? "w-8 bg-primary shadow-[0_0_8px_oklch(0.68_0.18_260)]"
              : n < current
              ? "w-4 bg-primary/50"
              : "w-4 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [painPoint, setPainPoint] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handlePainPoint(id: string) {
    setPainPoint(id);
    setStep(2);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  }

  async function handleNext() {
    if (!resumeFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("painPoint", painPoint ?? "");
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = (await res.json()) as { keywords?: string[] };
        if (data.keywords?.length) {
          localStorage.setItem("careerPortal.resumeKeywords", JSON.stringify(data.keywords));
        }
      }
    } catch {
      // continue even if upload fails
    }
    setUploading(false);
    startAnimation();
  }

  function startAnimation() {
    setAnimating(true);
    setMsgIndex(0);
    setMsgVisible(true);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        idx += 1;
        if (idx >= ANIMATION_MESSAGES.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => {
            setAnimating(false);
            setStep(3);
          }, 600);
          return;
        }
        setMsgIndex(idx);
        setMsgVisible(true);
      }, 400);
    }, 1100);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const ACCEPTED = ".doc,.docx,.pdf,.html,.rtf,.txt";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent)]" />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border/50 text-sm text-foreground px-4 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Animation overlay */}
      {animating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center px-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative rounded-full bg-primary/10 border border-primary/30 p-5">
                <BrainCircuit className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div
              className={`space-y-2 transition-opacity duration-300 ${
                msgVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <h2 className="text-2xl font-bold text-foreground">
                <span className="text-primary text-glow">
                  {ANIMATION_MESSAGES[msgIndex]?.main}
                </span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                {ANIMATION_MESSAGES[msgIndex]?.sub}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              This only takes a moment
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {ANIMATION_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === msgIndex ? "bg-primary scale-125" : "bg-primary/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium glow-shadow">
            <Sparkles className="w-4 h-4" suppressHydrationWarning /> Findmejob.ai
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          <StepIndicator current={step} />

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-1">
                Let&apos;s get you hired.
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                What is the most annoying part of job hunting for you?
              </p>
              <div className="flex flex-col gap-3">
                {PAIN_POINTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePainPoint(p.id)}
                    className="w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_12px_-4px_oklch(0.68_0.18_260)] transition-all text-sm font-medium text-foreground/90 group"
                  >
                    <span className="text-lg leading-none mt-0.5">{p.emoji}</span>
                    <span className="group-hover:text-foreground transition-colors">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-1">
                How do you want to upload your resume?
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                We&apos;ll use it to find and tailor jobs for you.
              </p>

              <div className="flex items-center gap-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 px-4 cursor-pointer transition-all ${
                    dragging
                      ? "border-primary bg-primary/10"
                      : resumeFile
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  {resumeFile ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                      <span className="text-xs text-primary font-medium text-center break-all max-w-[140px]">
                        {resumeFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-foreground font-medium">Drag and drop a file here</span>
                      <button
                        type="button"
                        className="mt-1 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        Browse
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setResumeFile(f);
                    }}
                  />
                </div>

                {/* OR divider */}
                <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground font-medium">
                  <div className="w-px h-12 bg-border/50" />
                  OR
                  <div className="w-px h-12 bg-border/50" />
                </div>

                {/* Cloud providers */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => showToast("Google Drive integration coming soon!")}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all text-sm font-medium text-foreground whitespace-nowrap"
                  >
                    <GoogleDriveIcon />
                    Google Drive
                  </button>
                  <button
                    onClick={() => showToast("Dropbox integration coming soon!")}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/40 transition-all text-sm font-medium text-foreground whitespace-nowrap"
                  >
                    <DropboxIcon />
                    Dropbox
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Files we can read: DOC, DOCX, PDF, HTML, RTF, TXT
              </p>

              {/* Nav */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted/30"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!resumeFile || uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_-3px_oklch(0.68_0.18_260)] hover:shadow-[0_0_20px_-3px_oklch(0.68_0.18_260)]"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 border border-primary/30 p-4">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                You&apos;re almost in.
              </h1>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                Sign in to save your profile and see your matched jobs — tailored just for you.
              </p>
              <button
                onClick={() => void signIn("google", { callbackUrl: "/pipeline" })}
                className="inline-flex items-center justify-center gap-3 w-full max-w-xs mx-auto px-6 py-3 bg-white text-gray-800 font-semibold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
