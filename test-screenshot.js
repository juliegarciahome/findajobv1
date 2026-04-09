const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/ryanh/Projects/career-portal-saas/playwright-test.png' });
  await browser.close();
})();