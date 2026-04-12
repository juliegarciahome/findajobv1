import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { env } from "@/lib/env";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reqSchema = z.object({
  jobId: z.string(),
  regenerate: z.boolean().optional(),
});

async function generateInterviewPrep(opts: {
  company: string;
  role: string;
  rawJd: string;
  resumeMarkdown: string;
  apiKey: string;
}): Promise<{
  processOverview: string;
  likelyQuestions: string;
  storyGapMap: string;
  techChecklist: string;
  companySignals: string;
  rawReport: string;
}> {
  if (!opts.apiKey) {
    return {
      processOverview: "Set ANTHROPIC_API_KEY to enable interview prep.",
      likelyQuestions: "",
      storyGapMap: "",
      techChecklist: "",
      companySignals: "",
      rawReport: "",
    };
  }

  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  const prompt = `You are an expert interview coach. Generate a comprehensive interview preparation guide for this candidate and role.

## COMPANY: ${opts.company}
## ROLE: ${opts.role}

## JOB DESCRIPTION:
${opts.rawJd.slice(0, 60_000)}

## CANDIDATE RESUME:
${opts.resumeMarkdown.slice(0, 40_000)}

---

Return STRICT JSON with these exact keys:

{
  "processOverview": "Typical interview process for this company/role: stages, timeline, format (technical/case/behavioral), what each round tests. If public info available, cite it.",

  "likelyQuestions": "Markdown list of 15-20 most likely questions organized by category: (1) Behavioral/STAR, (2) Technical/Domain, (3) Situational, (4) Company/Culture fit. For each, include the intent behind the question and a hint for answering.",

  "storyGapMap": "Table mapping JD requirements to STAR stories from resume: | Requirement | Story Available | Gap? | Recommended Story/Prep |. Highlight missing stories that need to be prepared.",

  "techChecklist": "Checklist of technical topics/tools mentioned in JD that the candidate should review: | Topic | Candidate Level | Prep Priority | Resources |",

  "companySignals": "Research findings: company mission/values, recent news/funding, product strategy, known challenges, culture signals from job posting, glassdoor sentiment if known. 3-5 key talking points to demonstrate company knowledge."
}

Be specific and actionable. Use evidence from both the JD and resume.`;

  const msg = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("\n");
  const j0 = text.indexOf("{");
  const j1 = text.lastIndexOf("}");
  if (j0 === -1 || j1 === -1) {
    return {
      processOverview: text.slice(0, 5000),
      likelyQuestions: "",
      storyGapMap: "",
      techChecklist: "",
      companySignals: "",
      rawReport: text,
    };
  }
  const parsed = JSON.parse(text.slice(j0, j1 + 1)) as {
    processOverview: string;
    likelyQuestions: string;
    storyGapMap: string;
    techChecklist: string;
    companySignals: string;
  };

  return { ...parsed, rawReport: text };
}

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return jsonNoStore({ error: "jobId required" }, { status: 400 });
  }

  const prep = await prisma.interviewPrep.findUnique({ where: { jobId } });
  return jsonNoStore(prep ?? { jobId });
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = reqSchema.parse(await req.json());

  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const job = await prisma.jobListing.findFirst({
    where: { id: body.jobId, userId: user.id },
  });

  if (!job) return jsonNoStore({ error: "Job not found" }, { status: 404 });

  if (!body.regenerate) {
    const existing = await prisma.interviewPrep.findUnique({ where: { jobId: body.jobId } });
    if (existing) return jsonNoStore(existing);
  }

  const baseResume = await prisma.baseResume.findUnique({ where: { userId: user.id } });

  const result = await generateInterviewPrep({
    company: job.company ?? "Unknown Company",
    role: job.role ?? "Unknown Role",
    rawJd: job.rawJd ?? "",
    resumeMarkdown: baseResume?.rawMarkdown ?? "",
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const prep = await prisma.interviewPrep.upsert({
    where: { jobId: body.jobId },
    update: {
      company: job.company ?? "Unknown",
      role: job.role ?? "Unknown",
      processOverview: result.processOverview,
      likelyQuestions: result.likelyQuestions,
      storyGapMap: result.storyGapMap,
      techChecklist: result.techChecklist,
      companySignals: result.companySignals,
      rawReport: result.rawReport,
      updatedAt: new Date(),
    },
    create: {
      jobId: body.jobId,
      company: job.company ?? "Unknown",
      role: job.role ?? "Unknown",
      processOverview: result.processOverview,
      likelyQuestions: result.likelyQuestions,
      storyGapMap: result.storyGapMap,
      techChecklist: result.techChecklist,
      companySignals: result.companySignals,
      rawReport: result.rawReport,
    },
  });

  return jsonNoStore(prep);
}
