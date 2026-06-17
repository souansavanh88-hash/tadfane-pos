import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.error('REQUEST FAILED:', req.url(), req.failure()?.errorText || req.response()?.status()));
  page.on('response', res => { if (!res.ok()) console.error('RESPONSE ERROR:', res.url(), res.status()); });
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await browser.close();
})();
