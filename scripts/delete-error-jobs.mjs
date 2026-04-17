import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_EMAIL = 'builder@sidequestapp.com';

async function main() {
  // Look up the user by email
  const user = await prisma.user.findUnique({ where: { email: TENANT_EMAIL } });
  if (!user) {
    console.log(`No user found for ${TENANT_EMAIL}`);
    return;
  }
  console.log(`User id: ${user.id}`);

  // Find all ERROR jobs for this user
  const jobs = await prisma.jobListing.findMany({
    where: { userId: user.id, status: 'ERROR' },
    select: { id: true, company: true, role: true },
  });

  console.log(`Found ${jobs.length} ERROR job(s)`);
  jobs.forEach(j => console.log(` - ${j.id}  ${j.company ?? '—'}  ${j.role ?? '—'}`));

  if (jobs.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  const ids = jobs.map(j => j.id);

  // Cascade-delete related records first
  const evalDel = await prisma.evaluation.deleteMany({ where: { jobId: { in: ids } } });
  console.log(`Deleted ${evalDel.count} evaluation(s)`);

  const followUpDel = await prisma.followUp.deleteMany({ where: { jobId: { in: ids } } });
  console.log(`Deleted ${followUpDel.count} follow-up(s)`);

  const storyDel = await prisma.storyBank.deleteMany({ where: { jobId: { in: ids } } });
  console.log(`Deleted ${storyDel.count} story bank entry(s)`);

  const prepDel = await prisma.interviewPrep.deleteMany({ where: { jobId: { in: ids } } });
  console.log(`Deleted ${prepDel.count} interview prep(s)`);

  // Delete the job listings
  const jobDel = await prisma.jobListing.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${jobDel.count} job listing(s)`);

  console.log('Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
