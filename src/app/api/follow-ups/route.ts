import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const followUpSchema = z.object({
  id: z.string().optional(),
  jobId: z.string(),
  channel: z.enum(["Email", "LinkedIn"]).default("Email"),
  contactName: z.string().nullish(),
  notes: z.string().nullish(),
  draftText: z.string().nullish(),
  followupNum: z.number().int().min(1).default(1),
  sent: z.boolean().default(false),
  sentAt: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const followUps = await prisma.followUp.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { company: true, role: true, appStatus: true } } },
  });

  return jsonNoStore({ followUps });
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = followUpSchema.parse(await req.json());
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  const followUp = body.id
    ? await prisma.followUp.update({
        where: { id: body.id },
        data: {
          channel: body.channel,
          contactName: body.contactName ?? null,
          notes: body.notes ?? null,
          draftText: body.draftText ?? null,
          followupNum: body.followupNum,
          sent: body.sent,
          sentAt: body.sentAt ? new Date(body.sentAt) : null,
        },
      })
    : await prisma.followUp.create({
        data: {
          userId: user.id,
          jobId: body.jobId,
          channel: body.channel,
          contactName: body.contactName ?? null,
          notes: body.notes ?? null,
          draftText: body.draftText ?? null,
          followupNum: body.followupNum,
          sent: body.sent,
          sentAt: body.sentAt ? new Date(body.sentAt) : null,
        },
      });

  return jsonNoStore(followUp);
}

export async function DELETE(req: NextRequest) {
  const email = getTenantEmail(req);
  const { id } = (await req.json()) as { id: string };
  const user = await prisma.user.upsert({
    where: { email }, update: {}, create: { email },
  });

  await prisma.followUp.deleteMany({ where: { id, userId: user.id } });
  return jsonNoStore({ ok: true });
}
