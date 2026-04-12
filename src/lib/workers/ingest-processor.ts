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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const html = await page.content();
  await browser.close();
  return html;
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

  for (const url of payload.urls) {
    // Ensure the row exists (API route should have created it, but guard here too).
    // Do NOT reset status to SCRAPING on update — that would clobber progress if
    // a parallel/retry call races with an already-running scrape.
    const job = await prisma.jobListing.upsert({
      where: { userId_url: { userId: user.id, url } },
      update: {},
      create: { userId: user.id, url, status: "SCRAPING" },
    });

    // Skip URLs that are already fully processed
    if (job.status === "EVALUATED" || job.status === "EVALUATING") {
      console.log(`[ingest] skipping ${url} — already ${job.status}`);
      continue;
    }

    // Mark as SCRAPING now that we're actively working on it
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
        profile: {
          fullName: profile.fullName,
          location: profile.location,
          targetRoles: profile.targetRoles,
          narrativeHeadline: profile.narrativeHeadline,
          compTarget: profile.compTarget,
        },
        baseResumeMarkdown: baseResume.rawMarkdown,
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
          blockFInterviewPrep: evalBlocks.blockFInterviewPrep,
        },
        create: {
          jobId: updatedJob.id,
          blockASummary: evalBlocks.blockASummary,
          blockBMatch: evalBlocks.blockBMatch,
          blockCStrategy: evalBlocks.blockCStrategy,
          blockDComp: evalBlocks.blockDComp,
          blockFInterviewPrep: evalBlocks.blockFInterviewPrep,
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
          { heading: "F) Interview Prep", body: evalBlocks.blockFInterviewPrep ?? "" },
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
          matchScore:
            typeof evalBlocks.matchScore === "number" ? evalBlocks.matchScore : null,
        },
      });
    } catch (e) {
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
}