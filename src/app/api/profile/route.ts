import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const proofPointSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
  heroMetric: z.string().nullish(),
});

const archetypeSchema = z.object({
  name: z.string(),
  level: z.string(),
  fit: z.enum(["primary", "secondary", "adjacent"]),
});

const schema = z.object({
  fullName: z.string().nullish(),
  location: z.string().nullish(),
  targetRoles: z.array(z.string()).nullish(),
  narrativeHeadline: z.string().nullish(),
  compTarget: z.string().nullish(),
  linkedinUrl: z.string().nullish(),
  portfolioUrl: z.string().nullish(),
  githubUrl: z.string().nullish(),
  exitStory: z.string().nullish(),
  superpowers: z.array(z.string()).nullish(),
  proofPoints: z.array(proofPointSchema).nullish(),
  archetypes: z.array(archetypeSchema).nullish(),
  compensationMin: z.string().nullish(),
  visaStatus: z.string().nullish(),
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

  const updateData: Record<string, unknown> = {};
  if (body.fullName !== undefined) updateData.fullName = body.fullName;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.targetRoles !== undefined) updateData.targetRoles = body.targetRoles ?? [];
  if (body.narrativeHeadline !== undefined) updateData.narrativeHeadline = body.narrativeHeadline;
  if (body.compTarget !== undefined) updateData.compTarget = body.compTarget;
  if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
  if (body.portfolioUrl !== undefined) updateData.portfolioUrl = body.portfolioUrl;
  if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl;
  if (body.exitStory !== undefined) updateData.exitStory = body.exitStory;
  if (body.superpowers !== undefined) updateData.superpowers = body.superpowers ?? [];
  if (body.proofPoints !== undefined) updateData.proofPoints = body.proofPoints ?? [];
  if (body.archetypes !== undefined) updateData.archetypes = body.archetypes ?? [];
  if (body.compensationMin !== undefined) updateData.compensationMin = body.compensationMin;
  if (body.visaStatus !== undefined) updateData.visaStatus = body.visaStatus;

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: updateData,
    create: {
      userId: user.id,
      fullName: body.fullName ?? null,
      location: body.location ?? null,
      targetRoles: body.targetRoles ?? [],
      narrativeHeadline: body.narrativeHeadline ?? null,
      compTarget: body.compTarget ?? null,
      linkedinUrl: body.linkedinUrl ?? null,
      portfolioUrl: body.portfolioUrl ?? null,
      githubUrl: body.githubUrl ?? null,
      exitStory: body.exitStory ?? null,
      superpowers: body.superpowers ?? [],
      proofPoints: body.proofPoints ?? [],
      archetypes: body.archetypes ?? [],
      compensationMin: body.compensationMin ?? null,
      visaStatus: body.visaStatus ?? null,
    },
  });

  return jsonNoStore(profile);
}
