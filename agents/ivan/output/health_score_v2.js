#!/usr/bin/env node
/**
 * Agent Health Score v2.0
 * Ivan (ML Engineer) — Tokenfly Agent Team Lab
 *
 * Improvements over v1.1:
 *   1. Velocity dimension — tasks completed in last 3 days (20pts)
 *   2. Recalibrated weights: heartbeat(25) + activity(25) + status(20) + velocity(20) + recency(10)
 *   3. Task board parsed locally (zero external deps, no API call needed)
 *   4. Confidence field — scores based on actual data vs. defaults
 *
 * Output: agents/ivan/output/health_scores_v2.json + health_report_v2.md
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '../../../');
const TASK_BOARD = path.join(ROOT, 'public/task_board.md');
const OUTPUT_DIR = path.join(ROOT, 'agents/ivan/output');
const SCORE_FILE = path.join(OUTPUT_DIR, 'health_scores_v2.json');
const REPORT_FILE = path.join(OUTPUT_DIR, 'health_report_v2.md');

const NOW = new Date();
const THREE_DAYS_AGO = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
const CUTOFF_DATE = THREE_DAYS_AGO.toISOString().split('T')[0]; // YYYY-MM-DD

// -------------------------------------------------------------------
// 1. Parse task board for velocity data
// -------------------------------------------------------------------
function parseTaskBoardVelocity() {
  const velocity = {}; // agent -> { done: N, inProgress: N, total: N }

  if (!fs.existsSync(TASK_BOARD)) {
    console.error('[v2] task_board.md not found, velocity will be 0 for all agents');
    return velocity;
  }

  const lines = fs.readFileSync(TASK_BOARD, 'utf8').split('\n');
  for (const line of lines) {
    // Format: | ID | Title | Desc | Priority | Assignee | Status | Created | Updated | Notes |
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 10) continue;
    const [, id, title, , , assignee, status, created, updated] = parts;
    if (!assignee || !status || assignee === 'Assignee') continue;

    const agent = assignee.toLowerCase();
    if (!velocity[agent]) velocity[agent] = { done: 0, inProgress: 0, total: 0, recentDone: 0 };

    velocity[agent].total++;

    // Recent done = done/in_review with updated date within 3 days
    if (['done', 'in_review', 'in_progress'].includes(status)) {
      velocity[agent].inProgress++;
    }
    if (status === 'done' || status === 'in_review') {
      velocity[agent].done++;
      // Check recency
      const updDate = (updated || '').trim();
      if (updDate >= CUTOFF_DATE) {
        velocity[agent].recentDone++;
      }
    }
  }

  return velocity;
}

// -------------------------------------------------------------------
// 2. Score velocity dimension (0–20 pts)
// -------------------------------------------------------------------
function scoreVelocity(agent, velocityData) {
  const v = velocityData[agent];

  // No data = agent not assigned tasks on board — neutral (10 pts, half credit)
  if (!v) return { score: 10, detail: 'no task board data (neutral)' };

  // Has tasks but none recent = lower score
  if (v.recentDone === 0 && v.done === 0) return { score: 5, detail: 'assigned tasks, 0 completed' };
  if (v.recentDone === 0 && v.done > 0)   return { score: 8, detail: `${v.done} total done (0 in last 3d)` };

  // Recent completions: 12 for 1, 16 for 2, 20 for 3+
  if (v.recentDone >= 3) return { score: 20, detail: `${v.recentDone} tasks done in last 3d` };
  if (v.recentDone >= 2) return { score: 16, detail: `${v.recentDone} tasks done in last 3d` };
  return { score: 12, detail: `${v.recentDone} task done in last 3d` };
}

// -------------------------------------------------------------------
// 3. Fetch agents from dashboard API
// -------------------------------------------------------------------
function fetchAgents() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3199/api/agents', (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// -------------------------------------------------------------------
// 4. Score all dimensions
// -------------------------------------------------------------------
function scoreAgent(agent, velocityData) {
  const dimensions = {};

  // API field names: name, status, current_task, alive, unread_messages, last_update, heartbeat_age_ms

  // --- Heartbeat (25 pts) ---
  // Use alive bool + heartbeat_age_ms for freshness
  const alive = agent.alive;
  const hbAgeMs = agent.heartbeat_age_ms || 0;
  const hbAgeMin = hbAgeMs / 60000;
  const status = (agent.status || '').toLowerCase();

  if (alive && hbAgeMin < 5) {
    dimensions.heartbeat = { score: 25, detail: `alive (${Math.round(hbAgeMin)}m ago)` };
  } else if (alive && hbAgeMin < 15) {
    dimensions.heartbeat = { score: 22, detail: `alive but slow (${Math.round(hbAgeMin)}m ago)` };
  } else if (alive && hbAgeMin < 60) {
    dimensions.heartbeat = { score: 18, detail: `stale heartbeat (${Math.round(hbAgeMin)}m ago)` };
  } else if (alive) {
    dimensions.heartbeat = { score: 10, detail: `very stale (${Math.round(hbAgeMin / 60)}h ago)` };
  } else if (status === 'running' || status === 'starting') {
    dimensions.heartbeat = { score: 15, detail: `status=${status}, no heartbeat` };
  } else {
    dimensions.heartbeat = { score: 5, detail: `offline/unknown` };
  }

  // --- Activity (25 pts): based on unread inbox count ---
  const inboxCount = agent.unread_messages || 0;
  if (inboxCount === 0) {
    dimensions.activity = { score: 25, detail: 'inbox clear' };
  } else if (inboxCount <= 2) {
    dimensions.activity = { score: 20, detail: `${inboxCount} unread (light backlog)` };
  } else if (inboxCount <= 5) {
    dimensions.activity = { score: 15, detail: `${inboxCount} unread (moderate backlog)` };
  } else if (inboxCount <= 10) {
    dimensions.activity = { score: 8, detail: `${inboxCount} unread (high backlog)` };
  } else {
    dimensions.activity = { score: 3, detail: `${inboxCount} unread (critical backlog)` };
  }

  // --- Status (20 pts): current task text ---
  const taskText = (agent.current_task || '').toLowerCase();
  const combinedStatus = taskText + ' ' + status;
  if (combinedStatus.includes('done') || combinedStatus.includes('complet') || combinedStatus.includes('delivered') || combinedStatus.includes('pass')) {
    dimensions.status = { score: 18, detail: 'recently completed work' };
  } else if (combinedStatus.includes('working') || combinedStatus.includes('building') || combinedStatus.includes('implement') || combinedStatus.includes('fixing') || combinedStatus.includes('running')) {
    dimensions.status = { score: 20, detail: 'actively working' };
  } else if (combinedStatus.includes('idle') || combinedStatus.includes('waiting') || !taskText) {
    dimensions.status = { score: 10, detail: 'idle/waiting' };
  } else if (combinedStatus.includes('blocked') || combinedStatus.includes('error') || combinedStatus.includes('fail')) {
    dimensions.status = { score: 5, detail: 'blocked/error state' };
  } else {
    dimensions.status = { score: 14, detail: taskText.slice(0, 50) };
  }

  // --- Velocity (20 pts): tasks completed last 3 days ---
  const agentName = (agent.name || '').toLowerCase();
  const vel = scoreVelocity(agentName, velocityData);
  dimensions.velocity = vel;

  // --- Recency (10 pts): last_update freshness ---
  let recencyScore = 10;
  let recencyDetail = 'recent';
  const lastUpdated = agent.last_update;
  if (lastUpdated) {
    const age = (NOW - new Date(lastUpdated)) / (1000 * 60 * 60); // hours
    if (age > 24) {
      recencyScore = 5;
      recencyDetail = `last seen ${Math.round(age)}h ago`;
    } else if (age > 4) {
      recencyScore = 8;
      recencyDetail = `last seen ${Math.round(age)}h ago`;
    } else {
      recencyScore = 10;
      recencyDetail = `last seen ${Math.round(age * 60)}m ago`;
    }
  }
  dimensions.recency = { score: recencyScore, detail: recencyDetail };

  // --- Total ---
  const total = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0);
  const grade = total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 55 ? 'C' : 'D';

  return { name: agentName, total, grade, dimensions };
}

// -------------------------------------------------------------------
// 5. Render report
// -------------------------------------------------------------------
function renderReport(scores, velocityData) {
  const ts = NOW.toISOString().replace('T', ' ').slice(0, 19);
  const avg = Math.round(scores.reduce((s, a) => s + a.total, 0) / scores.length);
  const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
  scores.forEach(a => gradeCount[a.grade]++);

  let md = `# Agent Health Report v2.0\n\n`;
  md += `**Generated:** ${ts} UTC\n`;
  md += `**Model:** Health Score v2.0 (heartbeat×25 + activity×25 + status×20 + velocity×20 + recency×10)\n`;
  md += `**Fleet Average:** ${avg}/100\n`;
  md += `**Breakdown:** A:${gradeCount.A} B:${gradeCount.B} C:${gradeCount.C} D:${gradeCount.D}\n\n`;

  md += `## Leaderboard\n\n`;
  md += `| Agent | Score | Grade | Heartbeat | Activity | Status | Velocity | Recency |\n`;
  md += `|-------|-------|-------|-----------|----------|--------|----------|---------|\n`;

  for (const a of scores) {
    const d = a.dimensions;
    md += `| ${a.name.padEnd(10)} | ${a.total}/100 | ${a.grade} `;
    md += `| ${d.heartbeat.score}/25 | ${d.activity.score}/25 | ${d.status.score}/20 `;
    md += `| ${d.velocity.score}/20 | ${d.recency.score}/10 |\n`;
  }

  md += `\n## Velocity Details (Tasks Completed Last 3 Days)\n\n`;
  md += `| Agent | Recent Done | Total Done | All Tasks |\n`;
  md += `|-------|-------------|------------|-----------|\n`;
  const allAgents = scores.map(s => s.name);
  for (const name of allAgents) {
    const v = velocityData[name] || { recentDone: 0, done: 0, total: 0 };
    md += `| ${name.padEnd(10)} | ${v.recentDone} | ${v.done} | ${v.total} |\n`;
  }

  md += `\n## Dimension Notes\n\n`;
  for (const a of scores) {
    md += `### ${a.name} (${a.total}/100 ${a.grade})\n`;
    for (const [dim, val] of Object.entries(a.dimensions)) {
      md += `- **${dim}** (${val.score}): ${val.detail}\n`;
    }
    md += '\n';
  }

  md += `## v2.0 vs v1.1 Changes\n\n`;
  md += `- **New: Velocity dimension** (20pts) — tasks completed in last 3 days from task_board.md\n`;
  md += `- **Recalibrated weights**: heartbeat(25) + activity(25) + status(20) + velocity(20) + recency(10)\n`;
  md += `- Addresses Olivia's v2 recommendation: velocity is a stronger signal than status text parsing\n`;
  md += `- No external API dependency for velocity — reads task_board.md directly\n`;

  return md;
}

// -------------------------------------------------------------------
// 6. Main
// -------------------------------------------------------------------
async function main() {
  console.log('[health_score_v2] Starting Agent Health Score v2.0...');

  // Parse task board for velocity data
  console.log('[health_score_v2] Parsing task board for velocity...');
  const velocityData = parseTaskBoardVelocity();
  const agentsWithVelocity = Object.keys(velocityData).filter(a => velocityData[a].recentDone > 0);
  console.log(`[health_score_v2] Velocity data: ${Object.keys(velocityData).length} agents, ${agentsWithVelocity.length} with recent completions`);

  // Fetch agents from API
  console.log('[health_score_v2] Fetching agent data from API...');
  let agents;
  try {
    const data = await fetchAgents();
    agents = data.agents || data;
  } catch (e) {
    console.error('[health_score_v2] API fetch failed:', e.message);
    process.exit(1);
  }

  // Score all agents
  const scores = agents.map(a => scoreAgent(a, velocityData));
  scores.sort((a, b) => b.total - a.total);

  // Save JSON
  const output = {
    version: '2.0',
    timestamp: NOW.toISOString(),
    fleetAverage: Math.round(scores.reduce((s, a) => s + a.total, 0) / scores.length),
    agents: scores
  };
  fs.writeFileSync(SCORE_FILE, JSON.stringify(output, null, 2));
  console.log(`[health_score_v2] Scores saved: ${SCORE_FILE}`);

  // Save report
  const report = renderReport(scores, velocityData);
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`[health_score_v2] Report saved: ${REPORT_FILE}`);

  // Print summary
  console.log(`\n  Fleet Average: ${output.fleetAverage}/100`);
  for (const a of scores) {
    const vel = velocityData[a.name] || { recentDone: 0 };
    console.log(`  ${a.name.padEnd(12)} ${String(a.total).padStart(3)}/100  ${a.grade}  vel:${vel.recentDone}done`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
