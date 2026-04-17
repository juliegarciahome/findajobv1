import { NextRequest } from "next/server";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { PORTALS, TITLE_FILTERS } from "@/data/portals";
import { z } from "zod";

export const dynamic = "force-dynamic";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  updated_at: string;
};

function matchesFilter(title: string, extraKeywords: string[] = []): boolean {
  const t = title.toLowerCase();
  const positive = [...TITLE_FILTERS.positive, ...extraKeywords];
  const hasPositive = positive.some((kw) => t.includes(kw.toLowerCase()));
  const hasNegative = TITLE_FILTERS.negative.some((kw) => t.includes(kw.toLowerCase()));
  return hasPositive && !hasNegative;
}

async function scanGreenhouseApi(apiUrl: string, company: string, extraKeywords: string[] = []): Promise<JobResult[]> {
  try {
    const res = await fetch(apiUrl, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs: GreenhouseJob[] };
    return (data.jobs ?? [])
      .filter((j) => matchesFilter(j.title, extraKeywords))
      .slice(0, 20)
      .map((j) => ({
        title: j.title,
        company,
        url: j.absolute_url,
        location: j.location?.name ?? "Unknown",
        source: "greenhouse_api" as const,
        postedAt: j.updated_at,
      }));
  } catch {
    return [];
  }
}

export type JobResult = {
  title: string;
  company: string;
  url: string;
  location: string;
  source: "greenhouse_api" | "playwright" | "websearch";
  postedAt?: string;
};

const reqSchema = z.object({
  categories: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
});

export async function POST(req: NextRequest) {
  getTenantEmail(req);
  const body = reqSchema.parse(await req.json());

  const portals = PORTALS.filter(
    (p) =>
      p.enabled &&
      p.scanMethod === "greenhouse_api" &&
      (!body.categories?.length || body.categories.includes(p.category))
  );

  const results: JobResult[] = [];

  const extraKeywords = body.keywords ?? [];

  // Run Greenhouse API calls in parallel batches of 5
  const BATCH = 5;
  for (let i = 0; i < portals.length; i += BATCH) {
    const batch = portals.slice(i, i + BATCH);
    const batchResults = await Promise.allSettled(
      batch.map((p) => scanGreenhouseApi(p.api!, p.name, extraKeywords))
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(...r.value);
    }
  }

  // For websearch portals just return their careers URLs so user can manually check
  const websearchPortals = PORTALS.filter(
    (p) =>
      p.enabled &&
      p.scanMethod === "websearch" &&
      (!body.categories?.length || body.categories.includes(p.category))
  );

  const portalList = websearchPortals.map((p) => ({
    company: p.name,
    careersUrl: p.careersUrl,
    notes: p.notes,
    category: p.category,
  }));

  return jsonNoStore({
    scannedAt: new Date().toISOString(),
    jobs: results.slice(0, body.limit),
    total: results.length,
    portalList,
    categories: [...new Set(PORTALS.map((p) => p.category))],
  });
}

export async function GET(req: NextRequest) {
  getTenantEmail(req);
  const categories = [...new Set(PORTALS.map((p) => p.category))];
  return jsonNoStore({
    portals: PORTALS.length,
    categories,
    apiPortals: PORTALS.filter((p) => p.scanMethod === "greenhouse_api").length,
    websearchPortals: PORTALS.filter((p) => p.scanMethod === "websearch").length,
  });
}
