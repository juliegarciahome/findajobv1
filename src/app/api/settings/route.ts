import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  googleApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { email: true, googleApiKey: true, claudeApiKey: true },
  });
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = schema.parse(await req.json());
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      googleApiKey: body.googleApiKey ?? undefined,
      claudeApiKey: body.claudeApiKey ?? undefined,
    },
    create: {
      email,
      googleApiKey: body.googleApiKey ?? null,
      claudeApiKey: body.claudeApiKey ?? null,
    },
    select: { email: true, googleApiKey: true, claudeApiKey: true },
  });
  return NextResponse.json(user);
}
