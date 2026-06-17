import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect all console messages and errors
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[PAGE_ERROR] ${error.message}`));
  
  // Override window.print to prevent actual print dialog
  await page.evaluateOnNewDocument(() => {
    window.print = () => { console.log('[PRINT] window.print() called'); };
    window.alert = (msg) => { console.log('[ALERT] ' + msg); };
  });
  
  console.log('1. Loading login page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  console.log('Page title:', await page.title());
  
  // Login as cashier
  console.log('2. Logging in as cashier...');
  await page.type('input[type="email"]', 'cashier@tadfane.com');
  await page.type('input[type="password"]', 'cashier123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !document.querySelector('input[type="email"]'), { timeout: 5000 });
  console.log('3. Logged in successfully');
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Find and click the "Create Booking & Print QR" button
  console.log('4. Looking for Create Booking button...');
  const createBtn = await page.$('button[type="submit"]');
  if (createBtn) {
    const btnText = await page.evaluate(el => el.textContent, createBtn);
    console.log('Found button:', btnText.trim().substring(0, 50));
    
    // Click it
    console.log('5. Clicking Create Booking...');
    await createBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    console.log('6. Button clicked, waiting...');
  } else {
    console.log('ERROR: Create Booking button NOT FOUND');
  }
  
  // Print all collected logs
  console.log('\n--- Console Logs ---');
  logs.forEach(l => console.log(l));
  
  await browser.close();
  process.exit(0);
})();
