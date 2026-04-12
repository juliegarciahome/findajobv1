import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Tenant email only. AI keys are server-wide from environment — not stored per user. */
export async function GET(req: NextRequest) {
  const email = getTenantEmail(req);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    select: { email: true },
  });
  return jsonNoStore({ email });
}
