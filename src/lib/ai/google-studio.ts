import { GoogleGenAI } from "@google/genai";

export type GoogleStudioExtract = {
  title?: string;
  salary?: string;
  remote?: string;
  techStack?: string[];
  company?: string;
};

export async function googleStudioExtractFromHtml(opts: {
  apiKey: string;
  html: string;
}): Promise<GoogleStudioExtract> {
  if (!opts.apiKey) {
    return {};
  }

  const ai = new GoogleGenAI({ apiKey: opts.apiKey });

  const prompt = `Extract job metadata from this HTML.
Return strict JSON with keys: title, company, salary, remote, techStack (array of strings).
HTML:\n${opts.html.slice(0, 200_000)}`;

  const resp = await ai.models.generateContent({
    model: process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash-preview-04-17",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = resp.text ?? "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return {};

  try {
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as GoogleStudioExtract;
  } catch {
    return {};
  }
}
