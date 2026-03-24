const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('pageerror', error => {
      console.log('\n--- CAPTURED PAGE ERROR ---');
      console.log(error.message);
      console.log('---------------------------\n');
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('\n--- CAPTURED CONSOLE ERROR ---');
        console.log(msg.text());
        console.log('------------------------------\n');
      }
    });

    console.log('Navigating to http://localhost:3000/rooms ...');
    await page.goto('http://localhost:3000/rooms', { waitUntil: 'networkidle2', timeout: 30000 });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('Puppeteer Script Error:', err);
  }
})();
