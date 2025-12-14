const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to vote page
  await page.goto('http://localhost:3000/vote');
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/workspace/screenshots/vote_initial.png', fullPage: true });
  console.log('Captured vote page initial state');
  
  // Click on the first company card to vote (left side)
  const cards = await page.locator('[class*="cursor-pointer"]').all();
  if (cards.length > 0) {
    await cards[0].click();
    await page.waitForTimeout(2000);
    
    // Take screenshot after voting
    await page.screenshot({ path: '/workspace/screenshots/vote_result.png', fullPage: true });
    console.log('Captured vote result');
    
    // Look for "Next Matchup" button
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/workspace/screenshots/vote_next.png', fullPage: true });
      console.log('Captured next matchup');
    }
  }
  
  // Navigate to leaderboard
  await page.goto('http://localhost:3000/leaderboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/workspace/screenshots/leaderboard_full.png', fullPage: true });
  console.log('Captured leaderboard');
  
  // Click on the first company to view profile
  const companyLinks = await page.locator('a[href*="/company/"]').all();
  if (companyLinks.length > 0) {
    await companyLinks[0].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/screenshots/company_profile.png', fullPage: true });
    console.log('Captured company profile');
  }
  
  await browser.close();
  console.log('Done!');
})();
