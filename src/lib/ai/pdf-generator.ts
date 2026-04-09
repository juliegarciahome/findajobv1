import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function generateEvaluationPdf(opts: {
  outDir: string;
  filename: string;
  title: string;
  sections: Array<{ heading: string; body: string }>;
}): Promise<{ path: string }> {
  await mkdir(opts.outDir, { recursive: true });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 760;
  const left = 48;

  page.drawText(opts.title, {
    x: left,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 28;

  for (const section of opts.sections) {
    if (y < 90) {
      y = 760;
      pdfDoc.addPage([612, 792]);
    }

    page.drawText(section.heading, {
      x: left,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 16;

    const lines = wrapText(section.body, 90);
    for (const line of lines) {
      if (y < 60) break;
      page.drawText(line, {
        x: left,
        y,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 12;
    }

    y -= 10;
  }

  const bytes = await pdfDoc.save();
  const outPath = join(opts.outDir, opts.filename);
  await writeFile(outPath, bytes);
  return { path: outPath };
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line) {
      line = w;
      continue;
    }
    if ((line + " " + w).length > maxLen) {
      lines.push(line);
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line) lines.push(line);
  return lines;
}
