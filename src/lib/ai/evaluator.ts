import Anthropic from "@anthropic-ai/sdk";

export type ScoreDimensions = {
  northStar: number;   // 0-5, weight 25%
  cvMatch: number;     // 0-5, weight 15%
  level: number;       // 0-5, weight 15%
  comp: number;        // 0-5, weight 10%
  growth: number;      // 0-5, weight 10%
  remote: number;      // 0-5, weight 5%
  reputation: number;  // 0-5, weight 5%
  techStack: number;   // 0-5, weight 5%
  speed: number;       // 0-5, weight 5%
  culture: number;     // 0-5, weight 5%
};

export type EvaluationBlocks = {
  archetype?: string;
  blockASummary?: string;
  blockBMatch?: string;
  blockCStrategy?: string;
  blockDComp?: string;
  blockEPersonalization?: string;
  blockFInterviewPrep?: string;
  blockGLegitimacy?: string;
  legitimacyTier?: "High Confidence" | "Proceed with Caution" | "Suspicious";
  sectionHDraftAnswers?: string;
  extractedKeywords?: string[];
  scoreDimensions?: ScoreDimensions;
  matchScore?: number; // 0-100 derived from weighted scoreDimensions
};

export function computeWeightedScore(dims: ScoreDimensions): number {
  const weighted =
    dims.northStar  * 0.25 +
    dims.cvMatch    * 0.15 +
    dims.level      * 0.15 +
    dims.comp       * 0.10 +
    dims.growth     * 0.10 +
    dims.remote     * 0.05 +
    dims.reputation * 0.05 +
    dims.techStack  * 0.05 +
    dims.speed      * 0.05 +
    dims.culture    * 0.05;
  // Convert 1-5 scale → 0-100
  return Math.round(((weighted - 1) / 4) * 100);
}

export async function evaluateJobWithClaude(opts: {
  apiKey: string;
  profile: {
    fullName?: string | null;
    location?: string | null;
    targetRoles: string[];
    narrativeHeadline?: string | null;
    compTarget?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    exitStory?: string | null;
    superpowers?: string[];
    proofPoints?: Array<{ name: string; url?: string; heroMetric?: string }>;
    archetypes?: Array<{ name: string; level: string; fit: string }>;
    compensationMin?: string | null;
    visaStatus?: string | null;
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
      blockBMatch: "Set ANTHROPIC_API_KEY in the server environment to enable Claude evaluation.",
      matchScore: 0,
    };
  }

  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  const proofPointsStr = opts.profile.proofPoints?.length
    ? opts.profile.proofPoints.map(p => `- ${p.name}: ${p.heroMetric ?? ""} ${p.url ? `(${p.url})` : ""}`).join("\n")
    : "None provided";

  const superpowersStr = opts.profile.superpowers?.length
    ? opts.profile.superpowers.join(", ")
    : "Not specified";

  const prompt = `You are an expert career strategist. Evaluate this job opportunity against the candidate's profile and produce a comprehensive structured JSON evaluation.

## CANDIDATE PROFILE
- Name: ${opts.profile.fullName ?? "Not provided"}
- Location: ${opts.profile.location ?? "Not provided"}
- Target Roles: ${opts.profile.targetRoles.join(", ") || "Not specified"}
- Headline: ${opts.profile.narrativeHeadline ?? "Not provided"}
- Comp Target: ${opts.profile.compTarget ?? "Not provided"}
- Exit Story: ${opts.profile.exitStory ?? "Not provided"}
- Superpowers: ${superpowersStr}
- Proof Points:
${proofPointsStr}

## BASE RESUME (markdown)
${opts.baseResumeMarkdown.slice(0, 80_000)}

## JOB
URL: ${opts.job.url}
Company: ${opts.job.company ?? "Unknown"}
Role: ${opts.job.role ?? "Unknown"}

## JOB DESCRIPTION (HTML/text)
${(opts.job.rawJd ?? "").slice(0, 80_000)}

---

Produce STRICT JSON with exactly these keys. Do not include any text outside the JSON object.

{
  "archetype": "One of: LLMOps | Agentic | PM | SA | FDE | Transformation | Engineering | Other",

  "blockASummary": "Table-style summary: archetype detected, domain, function, seniority, remote policy, team size if mentioned, TL;DR in 1 sentence",

  "blockBMatch": "Map each JD requirement to specific resume lines. Include a gaps section with severity (hard blocker / nice-to-have) and mitigation strategy for each gap",

  "blockCStrategy": "1) Detected level in JD vs candidate's natural level. 2) 'Sell senior' plan with specific phrases. 3) Downlevel negotiation strategy if offered lower",

  "blockDComp": "Compensation analysis: market rate for this role/location, candidate's target vs market, negotiation framing. Note if data unavailable.",

  "blockEPersonalization": "Table of exactly 5 specific changes to make to the CV + 5 changes to LinkedIn profile to maximize match for THIS specific job and archetype. Format as: | # | Section | Current | Proposed Change | Why |",

  "blockFInterviewPrep": "6-8 STAR+R stories (Situation, Task, Action, Result, Reflection) mapped to JD requirements. Include: 1 recommended case study to present, 2-3 red-flag questions and how to handle them. Format each story as: Requirement | Story Title | S | T | A | R | Reflection",

  "blockGLegitimacy": "Analyze job posting legitimacy based on: description quality (specific tech/team details vs generic boilerplate), realistic requirements, salary mentioned, scope clarity. Assess as one of 3 tiers with reasoning.",

  "legitimacyTier": "Exactly one of: High Confidence | Proceed with Caution | Suspicious",

  "sectionHDraftAnswers": "Only if overallScore >= 4.0: Draft answers for common application questions in 'I'm choosing you' tone: (1) Why this role? (2) Why this company? (3) Relevant achievement? (4) Good fit? Each 2-4 sentences, specific and concrete.",

  "extractedKeywords": ["array", "of", "15-20", "ATS", "keywords", "from", "the", "JD"],

  "scoreDimensions": {
    "northStar": 1-5 (5=exact target role, 1=unrelated),
    "cvMatch": 1-5 (5=90%+ match, 1=<40%),
    "level": 1-5 (5=staff+, 4=senior, 3=mid-senior, 2=mid, 1=junior),
    "comp": 1-5 (5=top quartile market, 1=below market),
    "growth": 1-5 (5=clear path to next level, 1=dead end),
    "remote": 1-5 (5=full remote async, 1=onsite only),
    "reputation": 1-5 (5=top employer/great signals, 1=red flags),
    "techStack": 1-5 (5=cutting edge AI/ML, 1=legacy),
    "speed": 1-5 (5=fast hiring process, 1=6+ months),
    "culture": 1-5 (5=builder/maker culture, 1=bureaucratic)
  },

  "overallScore": computed_weighted_float_1_to_5
}

The overallScore formula: (northStar*0.25 + cvMatch*0.15 + level*0.15 + comp*0.10 + growth*0.10 + remote*0.05 + reputation*0.05 + techStack*0.05 + speed*0.05 + culture*0.05)

Be specific and honest. Use actual evidence from the resume and JD. Do not fabricate metrics.`;

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 4096,
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

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as EvaluationBlocks & {
      overallScore?: number;
      scoreDimensions?: ScoreDimensions;
    };

    // Compute matchScore (0-100) from scoreDimensions
    let matchScore = 0;
    if (parsed.scoreDimensions) {
      matchScore = computeWeightedScore(parsed.scoreDimensions);
    } else if (typeof parsed.overallScore === "number") {
      matchScore = Math.round(((parsed.overallScore - 1) / 4) * 100);
    }

    return {
      ...parsed,
      matchScore,
    };
  } catch (e) {
    return {
      blockASummary: "Claude call failed; evaluation stubbed.",
      blockBMatch: String((e as Error).message).slice(0, 2000),
      matchScore: 0,
    };
  }
}
