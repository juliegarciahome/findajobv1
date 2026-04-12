import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const jobs = await prisma.jobListing.findMany({
    where: { userId: user.id },
    include: { evaluation: true },
    orderBy: { createdAt: "desc" },
  });

  const total = jobs.length;
  const evaluated = jobs.filter((j) => j.status === "EVALUATED").length;
  const applied = jobs.filter((j) => j.appStatus !== "NONE").length;
  const rejected = jobs.filter((j) => j.appStatus === "REJECTED").length;
  const interviewing = jobs.filter((j) => j.appStatus === "INTERVIEWING" || j.appStatus === "RESPONDED").length;
  const offers = jobs.filter((j) => j.appStatus === "OFFER").length;

  // Score distribution
  const scored = jobs.filter((j) => j.matchScore !== null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, j) => s + (j.matchScore ?? 0), 0) / scored.length)
    : 0;

  // Archetype breakdown
  const archetypeCounts: Record<string, number> = {};
  for (const j of jobs) {
    if (j.archetypeDetected) {
      archetypeCounts[j.archetypeDetected] = (archetypeCounts[j.archetypeDetected] ?? 0) + 1;
    }
  }

  // Legitimacy tier breakdown
  const legitimacyCounts: Record<string, number> = {};
  for (const j of jobs) {
    const tier = j.evaluation?.legitimacyTier;
    if (tier) {
      legitimacyCounts[tier] = (legitimacyCounts[tier] ?? 0) + 1;
    }
  }

  // Keyword frequency across all evaluations
  const keywordCounts: Record<string, number> = {};
  for (const j of jobs) {
    for (const kw of j.evaluation?.extractedKeywords ?? []) {
      keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([keyword, count]) => ({ keyword, count }));

  // Score dimension averages across all evaluated jobs
  const dimTotals: Record<string, number> = {};
  const dimCounts: Record<string, number> = {};
  for (const j of jobs) {
    const dims = j.evaluation?.scoreDimensions as Record<string, number> | null;
    if (dims) {
      for (const [k, v] of Object.entries(dims)) {
        dimTotals[k] = (dimTotals[k] ?? 0) + v;
        dimCounts[k] = (dimCounts[k] ?? 0) + 1;
      }
    }
  }
  const avgDimensions: Record<string, number> = {};
  for (const k of Object.keys(dimTotals)) {
    avgDimensions[k] = Math.round((dimTotals[k] / dimCounts[k]) * 10) / 10;
  }

  // Application funnel
  const statusBreakdown: Record<string, number> = {};
  for (const j of jobs) {
    statusBreakdown[j.appStatus] = (statusBreakdown[j.appStatus] ?? 0) + 1;
  }

  // Top scoring jobs
  const topJobs = [...jobs]
    .filter((j) => j.matchScore !== null && j.status === "EVALUATED")
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 10)
    .map((j) => ({
      id: j.id,
      company: j.company,
      role: j.role,
      matchScore: j.matchScore,
      appStatus: j.appStatus,
      archetypeDetected: j.archetypeDetected,
      legitimacyTier: j.evaluation?.legitimacyTier,
    }));

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentJobs = jobs.filter((j) => j.createdAt >= thirtyDaysAgo);

  return jsonNoStore({
    summary: {
      total,
      evaluated,
      applied,
      rejected,
      interviewing,
      offers,
      avgScore,
      conversionRate: applied > 0 ? Math.round((interviewing / applied) * 100) : 0,
    },
    archetypeCounts,
    legitimacyCounts,
    topKeywords,
    avgDimensions,
    statusBreakdown,
    topJobs,
    recentActivity: {
      ingested: recentJobs.length,
      applied: recentJobs.filter((j) => j.appStatus !== "NONE").length,
    },
  });
}
