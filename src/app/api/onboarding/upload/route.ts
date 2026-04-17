import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/html",
  "application/rtf",
  "text/rtf",
  "text/plain",
]);

const ALLOWED_EXTS = new Set([".pdf", ".doc", ".docx", ".html", ".rtf", ".txt"]);

async function extractKeywordsWithClaude(
  buffer: Buffer,
  ext: string
): Promise<string[]> {
  if (!env.ANTHROPIC_API_KEY) return [];

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

    let messageContent: Anthropic.MessageParam["content"];

    if (ext === ".pdf") {
      // Claude reads PDFs natively via the document content block
      const base64 = buffer.toString("base64");
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: 'Extract 8-12 job search keywords from this resume: job titles, skills, tools, and professional domains. Return ONLY a JSON array of strings, no explanation. Example: ["Product Manager", "SQL", "Machine Learning", "SaaS"]',
        },
      ];
    } else {
      // Extract plain text for other formats
      let text = "";
      if (ext === ".docx" || ext === ".doc") {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        // txt, html, rtf — read as utf-8
        text = buffer.toString("utf-8").slice(0, 12000);
      }

      messageContent = [
        {
          type: "text",
          text: `Extract 8-12 job search keywords from this resume: job titles, skills, tools, and professional domains. Return ONLY a JSON array of strings, no explanation. Example: ["Product Manager", "SQL", "Machine Learning", "SaaS"]\n\nResume text:\n${text}`,
        },
      ];
    }

    const response = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: messageContent }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((k): k is string => typeof k === "string")
      .slice(0, 12);
  } catch (err) {
    console.error("[onboarding/upload] Keyword extraction failed:", err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");
    const painPoint = formData.get("painPoint")?.toString() ?? "";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName: string = (file as File).name ?? "resume";
    const ext = originalName.includes(".")
      ? "." + originalName.split(".").pop()!.toLowerCase()
      : "";

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const mimeType = (file as File).type ?? "";
    if (mimeType && !ALLOWED_TYPES.has(mimeType) && !mimeType.startsWith("text/")) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = await (file as File).arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    const uploadDir = join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Extract keywords via Claude (non-blocking — errors return empty array)
    const keywords = await extractKeywordsWithClaude(buffer, ext);

    console.log(`[onboarding/upload] Saved: ${filename}, painPoint: ${painPoint}, keywords: ${keywords.join(", ")}`);

    return NextResponse.json({
      path: `/uploads/resumes/${filename}`,
      originalName,
      painPoint,
      keywords,
    });
  } catch (err) {
    console.error("[onboarding/upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
