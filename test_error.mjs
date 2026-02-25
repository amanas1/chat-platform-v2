import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.toString());
    console.log('STACK:', err.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE_ERROR:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch(e) {
    console.log('GOTO_ERROR:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
