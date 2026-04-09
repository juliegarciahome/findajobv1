import "dotenv/config";

// Prefill-only ATS bot scaffold.
// This worker is intentionally non-submitting.

import { chromium, type Page } from "playwright";

export type ApplyBotPayload = {
  url: string;
  email: string;
  fullName?: string;
  phone?: string;
};

async function tryFillCommonFields(page: Page, payload: ApplyBotPayload) {
  const candidates: Array<{ selector: string; value?: string }> = [
    { selector: 'input[name*="name" i]', value: payload.fullName },
    { selector: 'input[autocomplete="name"]', value: payload.fullName },
    { selector: 'input[type="email"]', value: payload.email },
    { selector: 'input[autocomplete="email"]', value: payload.email },
    { selector: 'input[type="tel"]', value: payload.phone },
    { selector: 'input[autocomplete="tel"]', value: payload.phone },
  ];

  for (const c of candidates) {
    if (!c.value) continue;
    const el = await page.locator(c.selector).first();
    if ((await el.count()) === 0) continue;
    try {
      await el.fill(c.value, { timeout: 1500 });
    } catch {
      // ignore
    }
  }
}

export async function runApplyBot(payload: ApplyBotPayload) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(payload.url, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Heuristic: click “Apply” buttons if present.
  const applyButtons = page
    .locator('text=/\\bapply\\b/i')
    .filter({ hasNot: page.locator('text=/submit/i') });

  if ((await applyButtons.count()) > 0) {
    try {
      await applyButtons.first().click({ timeout: 3000 });
    } catch {
      // ignore
    }
  }

  await tryFillCommonFields(page, payload);

  // Intentionally DO NOT click final submit.
  // We only take a screenshot for debugging.
  await page.screenshot({ path: `apply-prefill-${Date.now()}.png`, fullPage: true });

  await browser.close();
}

if (require.main === module) {
  // no-op when started as a worker later
  // keep process alive for future queue wiring
  setInterval(() => void 0, 60_000);
}