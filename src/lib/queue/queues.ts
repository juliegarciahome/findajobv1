import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/lib/env";

export type JobIngestPayload = {
  userEmail: string;
  urls: string[];
};

let _redis: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (_redis) return _redis;

  const redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redis.on("error", () => {
    // swallow connection errors; we fall back to inline mode in API
  });

  _redis = redis;
  return redis;
}

export function getIngestQueue() {
  return new Queue<JobIngestPayload>("job-ingest", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}

export async function enqueueIngest(payload: JobIngestPayload): Promise<{
  queued: boolean;
  reason?: string;
}> {
  try {
    const q = getIngestQueue();
    await q.add("ingest", payload);
    return { queued: true };
  } catch (e) {
    return { queued: false, reason: (e as Error).message };
  }
}