const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Wait for server
    await page.goto('http://localhost:3100', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for agents to load
    await page.waitForTimeout(3000);

    // Screenshot 1: Agents tab
    await page.screenshot({ path: path.join(screenshotDir, '01_agents_tab.png') });
    console.log('✓ Agents tab screenshot');

    // Screenshot 2: Missions tab
    await page.click('button[data-tab="tasks"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '02_missions_tab.png') });
    console.log('✓ Missions tab screenshot');

    // Screenshot 3: Agent detail modal
    await page.click('button[data-tab="agents"]');
    await page.waitForTimeout(500);
    await page.click('.agent-card:first-child');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '03_agent_modal.png') });
    console.log('✓ Agent modal screenshot');
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Screenshot 4: Facts tab
    await page.click('button[data-tab="research"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, '04_facts_tab.png') });
    console.log('✓ Facts tab screenshot');

    console.log('\n✅ All screenshots saved to ./screenshots/');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
