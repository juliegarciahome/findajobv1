import Anthropic from "@anthropic-ai/sdk";

export type EvaluationBlocks = {
  blockASummary?: string;
  blockBMatch?: string;
  blockCStrategy?: string;
  blockDComp?: string;
  blockFInterviewPrep?: string;
  matchScore?: number;
};

export async function evaluateJobWithClaude(opts: {
  apiKey: string;
  profile: {
    fullName?: string | null;
    location?: string | null;
    targetRoles: string[];
    narrativeHeadline?: string | null;
    compTarget?: string | null;
  };
  baseResumeMarkdown: string;
  job: {
    url: string;
    company?: string | null;
    role?: string | null;
    rawJd?: string | null;
  };
}): Promise<EvaluationBlocks> {
  if (!opts.apiKey) {
    return {
      blockASummary: "Claude key missing; evaluation stubbed.",
      blockBMatch:
        "Provide ANTHROPIC_API_KEY or user-level claudeApiKey to enable.",
      matchScore: 0,
    };
  }

  const client = new Anthropic({ apiKey: opts.apiKey });

  const prompt = `You are an expert career strategist. Produce a structured evaluation with blocks:
A) Summary
B) Match (strengths/gaps)
C) Strategy (positioning + resume focus)
D) Compensation
F) Interview Prep (STAR prompts)
Also output a numeric matchScore 0-100.
Return STRICT JSON with keys: blockASummary, blockBMatch, blockCStrategy, blockDComp, blockFInterviewPrep, matchScore.

Profile: ${JSON.stringify(opts.profile)}
BaseResumeMarkdown:\n${opts.baseResumeMarkdown.slice(0, 120_000)}

Job: ${JSON.stringify({ url: opts.job.url, company: opts.job.company, role: opts.job.role })}
JobDescription:\n${(opts.job.rawJd ?? "").slice(0, 120_000)}
`;

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 1400,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("\n");

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return { blockASummary: text.slice(0, 10_000) };
    }

    try {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as EvaluationBlocks;
    } catch {
      return { blockASummary: text.slice(0, 10_000) };
    }
  } catch (e) {
    return {
      blockASummary: "Claude call failed; evaluation stubbed.",
      blockBMatch: String((e as Error).message).slice(0, 2000),
      matchScore: 0,
    };
  }
}