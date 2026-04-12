import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { enqueueIngest } from "@/lib/queue/queues";
import { processIngestJob } from "@/lib/workers/ingest-processor";

const schema = z.object({
  urls: z.array(z.string().url()).min(1),
});

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = schema.parse(await req.json());

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  // Create placeholder rows immediately
  await Promise.all(
    body.urls.map((url) =>
      prisma.jobListing.upsert({
        where: { userId_url: { userId: user.id, url } },
        update: { status: "SCRAPING" },
        create: { userId: user.id, url, status: "SCRAPING" },
      })
    )
  );

  const enq = await enqueueIngest({ userEmail: email, urls: body.urls });

  if (enq.queued) {
    return NextResponse.json({ ok: true, mode: "queued", queued: true });
  }

  // Run scraper + AI in the background so the HTTP request returns quickly (no gateway timeout).
  void processIngestJob({ userEmail: email, urls: body.urls }).catch((err) => {
    console.error("[ingest] processIngestJob failed", err);
  });

  return NextResponse.json({
    ok: true,
    mode: "inline-async",
    queued: false,
    reason: enq.reason,
  });
}