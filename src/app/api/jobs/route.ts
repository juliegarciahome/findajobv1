import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const jobs = await prisma.jobListing.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { evaluation: true },
    take: 200,
  });

  return NextResponse.json({ jobs });
}
