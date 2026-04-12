import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const evals = await prisma.evaluation.findMany({
    where: { generatedPdfPath: { not: null } },
    select: { id: true, jobId: true, generatedPdfPath: true },
  });

  console.log('Evaluations with PDF path:', evals.length);

  const missing = evals.filter((e) => {
    const filePath = '/app/public' + e.generatedPdfPath;
    return !existsSync(filePath);
  });

  console.log('Missing PDF files:', missing.length);
  missing.forEach((e) => console.log(' -', e.generatedPdfPath));

  if (missing.length > 0) {
    const evalIds = missing.map((e) => e.id);
    const jobIds = missing.map((e) => e.jobId);

    await prisma.evaluation.updateMany({
      where: { id: { in: evalIds } },
      data: { generatedPdfPath: null },
    });

    await prisma.jobListing.updateMany({
      where: { id: { in: jobIds } },
      data: { status: 'EVALUATED' },
    });

    console.log('Done — cleared', missing.length, 'missing PDF references and reset job statuses to EVALUATED.');
  } else {
    console.log('No missing PDFs found.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
