import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().optional(),
  location: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  narrativeHeadline: z.string().optional(),
  compTarget: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, targetRoles: [] },
  });

  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = schema.parse(await req.json());
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      fullName: body.fullName ?? undefined,
      location: body.location ?? undefined,
      targetRoles: body.targetRoles ?? undefined,
      narrativeHeadline: body.narrativeHeadline ?? undefined,
      compTarget: body.compTarget ?? undefined,
    },
    create: {
      userId: user.id,
      fullName: body.fullName ?? null,
      location: body.location ?? null,
      targetRoles: body.targetRoles ?? [],
      narrativeHeadline: body.narrativeHeadline ?? null,
      compTarget: body.compTarget ?? null,
    },
  });

  return NextResponse.json(profile);
}
