import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  rawMarkdown: z.string(),
});

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const resume = await prisma.baseResume.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, rawMarkdown: "" },
  });

  return NextResponse.json(resume);
}

export async function POST(req: NextRequest) {
  const email = getTenantEmail(req);
  const body = schema.parse(await req.json());
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const resume = await prisma.baseResume.upsert({
    where: { userId: user.id },
    update: { rawMarkdown: body.rawMarkdown },
    create: { userId: user.id, rawMarkdown: body.rawMarkdown },
  });

  return NextResponse.json(resume);
}
