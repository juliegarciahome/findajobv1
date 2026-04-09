import "dotenv/config";

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/lib/env";
import { processIngestJob } from "@/lib/workers/ingest-processor";

const connection = new IORedis(env.REDIS_URL, {
  // BullMQ requires this to be null
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

connection.on("error", () => {
  // swallow connection errors; worker will idle if Redis is down
});

async function startWorker() {
  try {
    await connection.ping();
  } catch {
    setInterval(() => void 0, 60_000);
    return;
  }  console.log("Worker starting on job-ingest queue");  new Worker(
    "job-ingest",
    async (job) => {
      await processIngestJob(job.data);
      return { ok: true };
    },
    { connection }
  );
}

void startWorker();