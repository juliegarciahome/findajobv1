import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const job = await prisma.jobListing.findFirst({
    where: { id, userId: user.id },
    include: { evaluation: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
const allowedAppStatuses = ["NONE", "APPLIED", "RESPONDED", "INTERVIEWING", "OFFER", "REJECTED", "DISCARDED", "SKIP"] as const;

type AllowedAppStatus = (typeof allowedAppStatuses)[number];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const appStatus = (body as { appStatus?: unknown }).appStatus;
  if (typeof appStatus !== "string" || !allowedAppStatuses.includes(appStatus as AllowedAppStatus)) {
    return NextResponse.json(
      { error: "Invalid appStatus", allowed: allowedAppStatuses },
      { status: 400 }
    );
  }

  const res = await prisma.jobListing.updateMany({
    where: { id, userId: user.id },
    data: { appStatus },
  });

  if (res.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.jobListing.findFirst({
    where: { id, userId: user.id },
    include: { evaluation: true },
  });

  return NextResponse.json({ job: updated });
}