#!/usr/bin/env node
// take_screenshots.js — capture portal screenshots for README
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3100';
const OUT = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, setup) {
  if (setup) await setup(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('✓', name);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 860 });

  // Load page and wait for content
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Agents tab (default)
  await shot(page, '01_agents_tab.png');

  // 2. Tasks tab
  await shot(page, '02_tasks_tab.png', async (p) => {
    await p.click('[data-tab="tasks"]');
    await p.waitForTimeout(500);
  });

  // 3. Agent detail modal — click alice
  await shot(page, '03_agent_modal.png', async (p) => {
    await p.click('[data-tab="agents"]');
    await p.waitForTimeout(400);
    const card = await p.$('.agent-card');
    if (card) { await card.click(); await p.waitForTimeout(600); }
  });

  // 4. Agent modal — inbox tab
  await shot(page, '04_agent_inbox.png', async (p) => {
    const inboxBtn = await p.$('#agent-modal-tabs [data-mtab="inbox"]');
    if (inboxBtn) { await inboxBtn.click(); await p.waitForTimeout(400); }
  });

  // 5. Close modal, show mode switch
  await shot(page, '05_mode_switch.png', async (p) => {
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    await p.click('#mode-switch-btn');
    await p.waitForTimeout(400);
  });

  // 6. Broadcast modal — force close any open modal first
  await shot(page, '06_broadcast.png', async (p) => {
    // Force-close all modals via JS
    await p.evaluate(() => {
      document.querySelectorAll('.modal-overlay.visible').forEach(m => m.classList.remove('visible'));
    });
    await p.waitForTimeout(300);
    await p.click('#broadcast-btn');
    await p.waitForTimeout(500);
  });

  // 7. Stats tab
  await shot(page, '07_stats_tab.png', async (p) => {
    await p.evaluate(() => {
      document.querySelectorAll('.modal-overlay.visible').forEach(m => m.classList.remove('visible'));
    });
    await p.waitForTimeout(200);
    await p.click('[data-tab="stats"]');
    await p.waitForTimeout(600);
  });

  // 8. Announcements tab
  await shot(page, '08_announcements_tab.png', async (p) => {
    await p.click('[data-tab="announcements"]');
    await p.waitForTimeout(500);
  });

  await browser.close();
  console.log('\nAll screenshots saved to screenshots/');
})().catch(e => { console.error(e); process.exit(1); });
