import "dotenv/config";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { googleStudioExtractFromHtml } from "@/lib/ai/google-studio";
import { evaluateJobWithClaude } from "@/lib/ai/evaluator";
import { generateEvaluationPdf } from "@/lib/ai/pdf-generator";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

async function ensureUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}

async function scrapeHtml(url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const html = await page.content();
  await browser.close();
  return html;
}

async function processSingleUrl(opts: {
  userId: string;
  profileData: {
    fullName?: string | null;
    location?: string | null;
    targetRoles: string[];
    narrativeHeadline?: string | null;
    compTarget?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    exitStory?: string | null;
    superpowers?: string[];
    proofPoints?: Array<{ name: string; url?: string; heroMetric?: string }>;
    archetypes?: Array<{ name: string; level: string; fit: string }>;
    compensationMin?: string | null;
    visaStatus?: string | null;
  };
  baseResumeMarkdown: string;
  url: string;
}) {
  const { userId, profileData, baseResumeMarkdown, url } = opts;

  const job = await prisma.jobListing.upsert({
    where: { userId_url: { userId, url } },
    update: {},
    create: { userId, url, status: "SCRAPING" },
  });

  if (job.status === "EVALUATED" || job.status === "EVALUATING") {
    console.log(`[ingest] skipping ${url} — already ${job.status}`);
    return;
  }

  await prisma.jobListing.update({
    where: { id: job.id },
    data: { status: "SCRAPING" },
  });

  try {
    const html = await scrapeHtml(url);

    const extracted = await googleStudioExtractFromHtml({
      apiKey: env.GOOGLE_AI_API_KEY,
      html,
    });

    const updatedJob = await prisma.jobListing.update({
      where: { id: job.id },
      data: {
        status: "EVALUATING",
        company: extracted.company ?? job.company,
        role: extracted.title ?? job.role,
        rawJd: html,
        source: "scrape",
      },
    });

    const evalBlocks = await evaluateJobWithClaude({
      apiKey: env.ANTHROPIC_API_KEY,
      profile: profileData,
      baseResumeMarkdown,
      job: {
        url: updatedJob.url,
        company: updatedJob.company,
        role: updatedJob.role,
        rawJd: updatedJob.rawJd,
      },
    });

    await prisma.evaluation.upsert({
      where: { jobId: updatedJob.id },
      update: {
        blockASummary: evalBlocks.blockASummary,
        blockBMatch: evalBlocks.blockBMatch,
        blockCStrategy: evalBlocks.blockCStrategy,
        blockDComp: evalBlocks.blockDComp,
        blockEPersonalization: evalBlocks.blockEPersonalization,
        blockFInterviewPrep: evalBlocks.blockFInterviewPrep,
        blockGLegitimacy: evalBlocks.blockGLegitimacy,
        legitimacyTier: evalBlocks.legitimacyTier,
        sectionHDraftAnswers: evalBlocks.sectionHDraftAnswers,
        extractedKeywords: evalBlocks.extractedKeywords ?? [],
        archetype: evalBlocks.archetype,
        scoreDimensions: evalBlocks.scoreDimensions ? (evalBlocks.scoreDimensions as object) : undefined,
        overallScore: evalBlocks.scoreDimensions
          ? (evalBlocks.scoreDimensions.northStar * 0.25 +
             evalBlocks.scoreDimensions.cvMatch * 0.15 +
             evalBlocks.scoreDimensions.level * 0.15 +
             evalBlocks.scoreDimensions.comp * 0.10 +
             evalBlocks.scoreDimensions.growth * 0.10 +
             evalBlocks.scoreDimensions.remote * 0.05 +
             evalBlocks.scoreDimensions.reputation * 0.05 +
             evalBlocks.scoreDimensions.techStack * 0.05 +
             evalBlocks.scoreDimensions.speed * 0.05 +
             evalBlocks.scoreDimensions.culture * 0.05)
          : undefined,
      },
      create: {
        jobId: updatedJob.id,
        blockASummary: evalBlocks.blockASummary,
        blockBMatch: evalBlocks.blockBMatch,
        blockCStrategy: evalBlocks.blockCStrategy,
        blockDComp: evalBlocks.blockDComp,
        blockEPersonalization: evalBlocks.blockEPersonalization,
        blockFInterviewPrep: evalBlocks.blockFInterviewPrep,
        blockGLegitimacy: evalBlocks.blockGLegitimacy,
        legitimacyTier: evalBlocks.legitimacyTier,
        sectionHDraftAnswers: evalBlocks.sectionHDraftAnswers,
        extractedKeywords: evalBlocks.extractedKeywords ?? [],
        archetype: evalBlocks.archetype,
        scoreDimensions: evalBlocks.scoreDimensions ? (evalBlocks.scoreDimensions as object) : undefined,
        overallScore: evalBlocks.scoreDimensions
          ? (evalBlocks.scoreDimensions.northStar * 0.25 +
             evalBlocks.scoreDimensions.cvMatch * 0.15 +
             evalBlocks.scoreDimensions.level * 0.15 +
             evalBlocks.scoreDimensions.comp * 0.10 +
             evalBlocks.scoreDimensions.growth * 0.10 +
             evalBlocks.scoreDimensions.remote * 0.05 +
             evalBlocks.scoreDimensions.reputation * 0.05 +
             evalBlocks.scoreDimensions.techStack * 0.05 +
             evalBlocks.scoreDimensions.speed * 0.05 +
             evalBlocks.scoreDimensions.culture * 0.05)
          : undefined,
      },
    });

    const publicDir = join(process.cwd(), "public", "generated");
    await mkdir(publicDir, { recursive: true });

    await generateEvaluationPdf({
      outDir: publicDir,
      filename: `evaluation-${updatedJob.id}.pdf`,
      title: `${updatedJob.company ?? "Company"} — ${updatedJob.role ?? "Role"}`,
      sections: [
        { heading: "A) Summary", body: evalBlocks.blockASummary ?? "" },
        { heading: "B) Match", body: evalBlocks.blockBMatch ?? "" },
        { heading: "C) Strategy", body: evalBlocks.blockCStrategy ?? "" },
        { heading: "D) Compensation", body: evalBlocks.blockDComp ?? "" },
        { heading: "E) CV Personalization", body: evalBlocks.blockEPersonalization ?? "" },
        { heading: "F) Interview Prep", body: evalBlocks.blockFInterviewPrep ?? "" },
        { heading: "G) Legitimacy", body: evalBlocks.blockGLegitimacy ?? "" },
        { heading: "H) Draft Answers", body: evalBlocks.sectionHDraftAnswers ?? "" },
      ],
    });

    const publicPath = `/generated/evaluation-${updatedJob.id}.pdf`;
    await prisma.evaluation.update({
      where: { jobId: updatedJob.id },
      data: { generatedPdfPath: publicPath },
    });

    await prisma.jobListing.update({
      where: { id: updatedJob.id },
      data: {
        status: "EVALUATED",
        matchScore: typeof evalBlocks.matchScore === "number" ? evalBlocks.matchScore : null,
        archetypeDetected: evalBlocks.archetype,
      },
    });

    console.log(`[ingest] ✅ ${url} → ${updatedJob.company} | score=${evalBlocks.matchScore}`);
  } catch (e) {
    console.error(`[ingest] ❌ ${url}:`, e);
    await prisma.jobListing.update({
      where: { id: job.id },
      data: { status: "ERROR" },
    });
    await prisma.evaluation.upsert({
      where: { jobId: job.id },
      update: {
        blockASummary: "Processing failed.",
        blockBMatch: String((e as Error).message).slice(0, 2000),
      },
      create: {
        jobId: job.id,
        blockASummary: "Processing failed.",
        blockBMatch: String((e as Error).message).slice(0, 2000),
      },
    }).catch(() => void 0);
  }
}

export async function processIngestJob(payload: {
  userEmail: string;
  urls: string[];
}) {
  const user = await ensureUser(payload.userEmail);

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, targetRoles: [] },
  });

  const baseResume = await prisma.baseResume.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, rawMarkdown: "" },
  });

  const profileData = {
    fullName: profile.fullName,
    location: profile.location,
    targetRoles: profile.targetRoles,
    narrativeHeadline: profile.narrativeHeadline,
    compTarget: profile.compTarget,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    exitStory: profile.exitStory,
    superpowers: profile.superpowers,
    proofPoints: (profile.proofPoints as Array<{ name: string; url?: string; heroMetric?: string }> | null) ?? undefined,
    archetypes: (profile.archetypes as Array<{ name: string; level: string; fit: string }> | null) ?? undefined,
    compensationMin: profile.compensationMin,
    visaStatus: profile.visaStatus,
  };

  // Process all URLs in parallel (up to 3 concurrent)
  const CONCURRENCY = 3;
  for (let i = 0; i < payload.urls.length; i += CONCURRENCY) {
    const batch = payload.urls.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map((url) =>
        processSingleUrl({
          userId: user.id,
          profileData,
          baseResumeMarkdown: baseResume.rawMarkdown,
          url,
        })
      )
    );
  }
}
