const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to vote page
  await page.goto('http://localhost:3000/vote');
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/workspace/screenshots/vote_before.png', fullPage: true });
  console.log('Captured vote page before voting');
  
  // Try to find and click on a company card - look for divs that might be clickable
  const content = await page.content();
  console.log('Page has loaded, looking for company cards...');
  
  // Try different selectors for company cards
  let clicked = false;
  const selectors = [
    'div[class*="border"][class*="rounded"]',
    'div[class*="card"]',
    'div[class*="Company"]',
    'button',
    'div[class*="bg-white"]',
    '[role="button"]'
  ];
  
  for (const selector of selectors) {
    const elements = await page.locator(selector).all();
    console.log(`Found ${elements.length} elements with selector: ${selector}`);
    if (elements.length >= 2 && !clicked) {
      try {
        await elements[0].click();
        clicked = true;
        console.log(`Clicked first element with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`Failed to click: ${e.message}`);
      }
    }
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/vote_after.png', fullPage: true });
  console.log('Captured after click attempt');
  
  // Try clicking a specific button that looks like "Vote" or company name
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log(`Button text: ${text}`);
  }
  
  await browser.close();
  console.log('Done!');
})();
