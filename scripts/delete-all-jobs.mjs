import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_EMAIL = 'builder@sidequestapp.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TENANT_EMAIL } });
  if (!user) {
    console.log(`No user found for ${TENANT_EMAIL}`);
    return;
  }
  console.log(`User id: ${user.id}`);

  const jobs = await prisma.jobListing.findMany({
    where: { userId: user.id },
    select: { id: true, company: true, role: true, status: true },
  });

  console.log(`Found ${jobs.length} total job(s)`);
  jobs.forEach(j => console.log(` - [${j.status}] ${j.company ?? '—'}  ${j.role ?? '—'}`));

  if (jobs.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  const ids = jobs.map(j => j.id);

  const evalDel     = await prisma.evaluation.deleteMany({ where: { jobId: { in: ids } } });
  const followUpDel = await prisma.followUp.deleteMany({ where: { jobId: { in: ids } } });
  const storyDel    = await prisma.storyBank.deleteMany({ where: { jobId: { in: ids } } });
  const prepDel     = await prisma.interviewPrep.deleteMany({ where: { jobId: { in: ids } } });
  const jobDel      = await prisma.jobListing.deleteMany({ where: { id: { in: ids } } });

  console.log(`Deleted ${evalDel.count} evaluation(s)`);
  console.log(`Deleted ${followUpDel.count} follow-up(s)`);
  console.log(`Deleted ${storyDel.count} story bank entry(s)`);
  console.log(`Deleted ${prepDel.count} interview prep(s)`);
  console.log(`Deleted ${jobDel.count} job listing(s)`);
  console.log('Done — pipeline is now empty.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
