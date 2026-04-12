import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const storySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
  reflection: z.string(),
  tags: z.array(z.string()).default([]),
  jobId: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const stories = await prisma.storyBank.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { job: { select: { company: true, role: true } } },
  });

  return jsonNoStore({ stories });
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = storySchema.parse(await req.json());
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const story = body.id
    ? await prisma.storyBank.update({
        where: { id: body.id },
        data: {
          title: body.title,
          situation: body.situation,
          task: body.task,
          action: body.action,
          result: body.result,
          reflection: body.reflection,
          tags: body.tags,
          jobId: body.jobId ?? null,
        },
      })
    : await prisma.storyBank.create({
        data: {
          userId: user.id,
          title: body.title,
          situation: body.situation,
          task: body.task,
          action: body.action,
          result: body.result,
          reflection: body.reflection,
          tags: body.tags,
          jobId: body.jobId ?? null,
        },
      });

  return jsonNoStore(story);
}

export async function DELETE(req: NextRequest) {
  const email = getTenantEmail(req);
  const { id } = (await req.json()) as { id: string };
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  await prisma.storyBank.deleteMany({ where: { id, userId: user.id } });
  return jsonNoStore({ ok: true });
}
