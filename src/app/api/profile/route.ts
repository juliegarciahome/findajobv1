import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().nullish(),
  location: z.string().nullish(),
  targetRoles: z.array(z.string()).nullish(),
  narrativeHeadline: z.string().nullish(),
  compTarget: z.string().nullish(),
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

  return jsonNoStore(profile);
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
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.targetRoles !== undefined
        ? { targetRoles: body.targetRoles ?? [] }
        : {}),
      ...(body.narrativeHeadline !== undefined
        ? { narrativeHeadline: body.narrativeHeadline }
        : {}),
      ...(body.compTarget !== undefined ? { compTarget: body.compTarget } : {}),
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

  return jsonNoStore(profile);
}
