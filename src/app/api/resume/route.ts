import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantEmail } from "@/lib/tenant";
import { jsonNoStore } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  rawMarkdown: z.string(),
});

const DEFAULT_RESUME = `# Julie Garcia
San Francisco, CA · juliegarciahome@gmail.com · (415) 555-0137 · https://linkedin.com/in/juliegarcia · https://github.com/juliegarcia

## Headline
Full-stack software engineer focused on shipping reliable, user-centered products with measurable business impact.

## Summary
- 6+ years building web apps and internal tools in TypeScript/React/Node.js.
- Strong in API design, data modeling, observability, and pragmatic architecture.
- Comfortable owning features end-to-end: discovery → implementation → rollout → iteration.

## Core Skills
- **Frontend**: React, Next.js, TypeScript, Tailwind, component systems, accessibility
- **Backend**: Node.js, REST/GraphQL, background jobs, auth, rate limiting
- **Data**: PostgreSQL, Prisma/ORMs, schema design, migrations, ETL basics
- **Infra/DevOps**: Docker, CI/CD, monitoring, logging, performance tuning
- **Testing**: Playwright, Jest/Vitest, integration tests, test pyramids

## Experience

### Senior Software Engineer — SideQuest App
San Francisco, CA · 2022–Present
- Led rebuild of a multi-tenant dashboard in Next.js, improving load time by 45% and reducing support tickets by 30%.
- Designed PostgreSQL schemas and Prisma models for pipeline tracking, audit logs, and role-based access.
- Built background workers (BullMQ/Redis) for scraping + enrichment workflows; improved throughput 3× with batching and retries.
- Implemented observability (structured logs + error tracing) and incident runbooks, reducing MTTR from hours to minutes.

### Software Engineer — Hype Digital Media
Remote · 2019–2022
- Shipped customer-facing features in React/TypeScript and Node APIs; delivered 20+ releases across marketing and admin surfaces.
- Developed PDF generation pipeline for invoices/contracts; reduced manual processing time by ~80%.
- Improved reliability by adding integration tests and progressive rollouts; lowered regression rate by ~25%.

### Software Engineer — Freelance / Contract
2017–2019
- Built small business websites and internal tools (CRM-like workflows, lead intake forms, reporting dashboards).
- Automated data imports/exports and created admin tooling to reduce repetitive operations.

## Selected Projects
- **Jobs Pipeline Portal (MVP)**: Next.js + Prisma + Postgres, background workers, and PDF outputs for evaluation reporting.
- **Scraper Enrichment Worker**: Playwright-based scraping with queue-driven retries and structured extraction output.

## Education
B.S. Computer Science — State University (2017)

## Certifications (Optional)
- AWS Cloud Practitioner (Optional)
- Google Analytics (Optional)

## Additional
- Work authorization: US
- Preferred roles: Full-stack, Frontend-leaning Full-stack, Platform tooling
- Interests: product engineering, automation, developer experience`;

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
    create: { userId: user.id, rawMarkdown: DEFAULT_RESUME },
  });

  return jsonNoStore(resume);
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

  return jsonNoStore(resume);
}