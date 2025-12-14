const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 1400, height: 900 });
  
  // Navigate to vote page
  await page.goto('http://localhost:3000/vote');
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/workspace/screenshots/vote_step1_initial.png', fullPage: true });
  console.log('Step 1: Captured initial vote page');
  
  // Click on the first company button (Midjourney)
  const companyButtons = await page.locator('button:has-text("ELO")').all();
  console.log(`Found ${companyButtons.length} company buttons`);
  
  if (companyButtons.length >= 1) {
    await companyButtons[0].click();
    console.log('Clicked on first company to vote');
    await page.waitForTimeout(3000);
    
    // Take screenshot after voting
    await page.screenshot({ path: '/workspace/screenshots/vote_step2_result.png', fullPage: true });
    console.log('Step 2: Captured vote result');
    
    // Click "Skip / New Matchup" button
    const skipButton = page.locator('button:has-text("Next"), button:has-text("Matchup"), button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      console.log('Clicked Skip / New Matchup');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: '/workspace/screenshots/vote_step3_next.png', fullPage: true });
      console.log('Step 3: Captured next matchup');
    }
  }
  
  // Navigate to leaderboard
  await page.goto('http://localhost:3000/leaderboard');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/screenshots/leaderboard_step4.png', fullPage: true });
  console.log('Step 4: Captured leaderboard');
  
  // Click on first company link
  const links = await page.locator('a[href*="/company/"]').all();
  console.log(`Found ${links.length} company links`);
  
  if (links.length >= 1) {
    await links[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/screenshots/company_step5_profile.png', fullPage: true });
    console.log('Step 5: Captured company profile');
  }
  
  await browser.close();
  console.log('All done!');
})();
