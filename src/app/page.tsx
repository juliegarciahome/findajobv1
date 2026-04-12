import Link from "next/link";
import { Search, MapPin, Sparkles, ArrowRight, FileText, Activity } from "lucide-react";

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
            We find your jobs. <br className="hidden sm:block" />
            We fix your <span className="text-primary text-glow">resume.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Tell us your skills, salary, and location. We surface every matching job in the world — then automatically tailor your resume for each one. Save hours every day.
          </p>

          {/* Floating Search Hero Card */}
          <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-3xl mx-auto glow-shadow">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 bg-background/50 border border-border/50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                <div className="flex items-center gap-3 px-2">
                  <Search suppressHydrationWarning className="w-5 h-5 text-muted-foreground" />
                  <input
                    className="w-full outline-none text-sm bg-transparent py-1.5 text-foreground placeholder:text-muted-foreground"
                    placeholder="Company, role, or keyword…"
                  />
                </div>
              </div>
              <div className="md:col-span-4 bg-background/50 border border-border/50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                <div className="flex items-center gap-3 px-2">
                  <MapPin suppressHydrationWarning className="w-5 h-5 text-muted-foreground" />
                  <input 
                    className="w-full outline-none text-sm bg-transparent py-1.5 text-foreground placeholder:text-muted-foreground" 
                    placeholder="Remote, SF…" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex items-stretch">
                <Link
                  href="/pipeline"
                  className="w-full h-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_oklch(0.68_0.18_260)] hover:shadow-[0_0_25px_-5px_oklch(0.68_0.18_260)]"
                >
                  Start <ArrowRight suppressHydrationWarning className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
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

        {/* How It Works */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sparkles suppressHydrationWarning className="w-5 h-5 text-primary" /> How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-medium text-foreground">Set up your profile in 2 minutes</h4>
                  <p className="text-sm text-muted-foreground mt-1">Go to <Link href="/settings" className="text-primary hover:underline">Settings</Link> and paste your resume. That's all the AI needs to start working for you.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-medium text-foreground">Find a job you like and paste the link</h4>
                  <p className="text-sm text-muted-foreground mt-1">Go to the <Link href="/pipeline" className="text-primary hover:underline">Pipeline</Link>, drop in any job URL, and we take care of the rest. No forms to fill out.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-medium text-foreground">Get your AI report and take action</h4>
                  <p className="text-sm text-muted-foreground mt-1">See your match score, what to highlight, how to prep for the interview, and download a full PDF — then track it all the way to an offer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}