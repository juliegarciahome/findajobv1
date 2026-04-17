import Link from "next/link";
import { Search, FileText, Activity, Sparkles } from "lucide-react";
import { GetStartedButton } from "@/components/get-started-button";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Sleek Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent)]" />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8 glow-shadow">
            <Sparkles suppressHydrationWarning className="w-4 h-4" /> Your Personal AI Job Search Assistant
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 mb-6 drop-shadow-sm">
            Job hunting is <span className="text-primary text-glow">stressful.</span> <br className="hidden sm:block" />
            Let us do the <span className="text-primary text-glow">work.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            We find the perfect roles, customize your resume, apply on your behalf. You sit back; we hustle. Always 100% free.
          </p>

          {/* CTA + Quick Links */}
          <div className="flex flex-col items-center gap-6">
            <GetStartedButton />
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Quick links:</span>
              <Link href="/dashboard" className="hover:text-primary transition-colors hover:text-glow">Dashboard</Link>
              <span className="opacity-30">•</span>
              <Link href="/pipeline" className="hover:text-primary transition-colors hover:text-glow">Pipeline</Link>
              <span className="opacity-30">•</span>
              <Link href="/scan" className="hover:text-primary transition-colors hover:text-glow">Scanner</Link>
              <span className="opacity-30">•</span>
              <Link href="/settings" className="hover:text-primary transition-colors hover:text-glow">Settings</Link>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10">
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 hover:border-primary/30 transition-all group">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search suppressHydrationWarning className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Just Drop a Link</h3>
            <p className="text-sm text-muted-foreground">Copy the job posting URL from anywhere — LinkedIn, company websites, Greenhouse, Lever, Ashby — and we automatically read the full details for you. No copy-pasting required.</p>
          </div>
          
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10">
              <FileText suppressHydrationWarning className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 relative z-10">Know Exactly Where You Stand</h3>
            <p className="text-sm text-muted-foreground relative z-10">Our AI reads your resume and the job posting side by side, scores your fit out of 100, spots the gaps, and tells you exactly what to say — plus a full PDF report you can keep.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 hover:border-primary/30 transition-all group">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity suppressHydrationWarning className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Never Lose Track Again</h3>
            <p className="text-sm text-muted-foreground">See every job you've applied for in one place. Track where you are — Applied, Interviewing, Offer, Rejected — so nothing falls through the cracks.</p>
          </div>
        </div>


      </div>
    </main>
  );
}