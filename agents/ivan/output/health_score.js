#!/usr/bin/env node
/**
 * Agent Health Scoring — Prototype
 * Ivan (ML Engineer) — Task #46
 *
 * Computes a 0-100 health score for each agent using:
 *   - heartbeat freshness
 *   - task activity
 *   - status field
 *   - recency of last status.md update
 *   - unread message backlog penalty
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '../../..');
const SERVER = 'http://localhost:3199';

// ─── Scoring Weights ───────────────────────────────────────────────────────────
const WEIGHTS = {
  heartbeat: 30,   // How recently did the agent write a heartbeat?
  activity:  30,   // Does the agent have an active, meaningful task?
  status:    20,   // Is the agent's status field "running"?
  recency:   20,   // How recently was status.md last updated?
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    }).on('error', reject);
  });
}

function heartbeatScore(heartbeatAgeMs) {
  if (heartbeatAgeMs === null || heartbeatAgeMs === undefined) return 10; // unknown — partial credit
  const mins = heartbeatAgeMs / 60000;
  if (mins < 5)   return 30;
  if (mins < 15)  return 22;
  if (mins < 60)  return 12;
  if (mins < 240) return 5;
  return 0;
}

function activityScore(currentTask) {
  if (!currentTask) return 0;
  const t = currentTask.trim();
  if (t.length < 10) return 5;
  // Penalty for vague/idle phrases
  const idlePhrases = ['no active', 'looking for', 'monitoring', 'none', 'idle', 'complete'];
  const lower = t.toLowerCase();
  if (idlePhrases.some(p => lower.startsWith(p))) return 12;
  // Bonus for explicit task references
  if (/task\s*#\d+/i.test(t) || /task\s+\d+/i.test(t)) return 30;
  return 22;
}

function statusScore(status) {
  if (!status) return 5;
  const s = status.toLowerCase();
  if (s === 'running') return 20;
  if (s === 'active')  return 18;
  if (s === 'idle')    return 8;
  return 5;
}

function recencyScore(lastSeenSecs) {
  if (lastSeenSecs === null || lastSeenSecs === undefined) return 5;
  if (lastSeenSecs < 60)   return 20;  // < 1 min
  if (lastSeenSecs < 300)  return 15;  // < 5 min
  if (lastSeenSecs < 900)  return 10;  // < 15 min
  if (lastSeenSecs < 3600) return 5;   // < 1 hr
  return 0;
}

function unreadPenalty(unreadMessages) {
  if (!unreadMessages) return 0;
  if (unreadMessages > 60) return 10;  // Heavy backlog — agent not processing inbox
  if (unreadMessages > 30) return 5;
  return 0;
}

// ─── Main Scoring Function ────────────────────────────────────────────────────

function scoreAgent(agent) {
  const hb    = heartbeatScore(agent.heartbeat_age_ms);
  const act   = activityScore(agent.current_task);
  const stat  = statusScore(agent.status);
  const rec   = recencyScore(agent.lastSeenSecs);
  const penalty = unreadPenalty(agent.unread_messages);

  const raw   = hb + act + stat + rec - penalty;
  const score = Math.max(0, Math.min(100, raw));

  return {
    name:            agent.name,
    role:            agent.role,
    score,
    components: {
      heartbeat:   hb,
      activity:    act,
      status_field: stat,
      recency:     rec,
      penalty:     -penalty,
    },
    signals: {
      heartbeat_age_ms: agent.heartbeat_age_ms,
      current_task:     (agent.current_task || '').slice(0, 80),
      status:           agent.status,
      lastSeenSecs:     agent.lastSeenSecs,
      unread_messages:  agent.unread_messages,
    },
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
  };
}

// ─── Report Generator ─────────────────────────────────────────────────────────

function generateMarkdownReport(results) {
  const now = new Date().toISOString();
  const sorted = [...results].sort((a, b) => b.score - a.score);

  const gradeEmoji = { A: '✅', B: '🟢', C: '🟡', D: '🟠', F: '🔴' };

  let md = `# Agent Health Scoring Report\n\n`;
  md += `**Generated**: ${now}  \n`;
  md += `**Model**: v1.0 — Ivan (ML Engineer), Task #46  \n`;
  md += `**Agents Scored**: ${results.length}\n\n`;

  // Summary table
  md += `## Scores Summary\n\n`;
  md += `| Agent | Role | Score | Grade | Heartbeat | Activity | Status | Recency | Penalty |\n`;
  md += `|-------|------|------:|-------|----------:|---------:|-------:|--------:|--------:|\n`;

  for (const r of sorted) {
    const c = r.components;
    md += `| **${r.name}** | ${r.role} | **${r.score}** | ${gradeEmoji[r.grade]} ${r.grade} `;
    md += `| ${c.heartbeat} | ${c.activity} | ${c.status_field} | ${c.recency} | ${c.penalty} |\n`;
  }

  // Distribution
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of results) grades[r.grade]++;
  const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  const top3 = sorted.slice(0, 3).map(r => `${r.name}(${r.score})`).join(', ');
  const bot3 = sorted.slice(-3).reverse().map(r => `${r.name}(${r.score})`).join(', ');

  md += `\n## Fleet Overview\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Mean Score | ${avg} |\n`;
  md += `| Grade A (80-100) | ${grades.A} agents |\n`;
  md += `| Grade B (60-79)  | ${grades.B} agents |\n`;
  md += `| Grade C (40-59)  | ${grades.C} agents |\n`;
  md += `| Grade D (20-39)  | ${grades.D} agents |\n`;
  md += `| Grade F (0-19)   | ${grades.F} agents |\n`;
  md += `| Top Performers | ${top3} |\n`;
  md += `| Needs Attention | ${bot3} |\n`;

  // Scoring model explanation
  md += `\n## Scoring Model\n\n`;
  md += `Health score is the sum of four components (max 100), minus an inbox penalty:\n\n`;
  md += `| Component | Max | Signal Used | Rationale |\n`;
  md += `|-----------|----:|-------------|----------|\n`;
  md += `| Heartbeat | 30 | \`heartbeat_age_ms\` | Freshest liveness signal — agent actively wrote a heartbeat |\n`;
  md += `| Activity  | 30 | \`current_task\` | Is agent doing real work? Task #N refs = full score |\n`;
  md += `| Status    | 20 | \`status\` field | "running" = healthy; "idle" = partial |\n`;
  md += `| Recency   | 20 | \`lastSeenSecs\` | How recently status.md was updated |\n`;
  md += `| Penalty   | -10 | \`unread_messages\` | >60 unread = agent not processing inbox (-10 pts) |\n\n`;

  md += `### Heartbeat Thresholds\n`;
  md += `| Age | Score |\n|-----|------:|\n`;
  md += `| < 5 min | 30 |\n| 5–15 min | 22 |\n| 15–60 min | 12 |\n| 1–4 hrs | 5 |\n| > 4 hrs or missing | 0–10 |\n\n`;

  md += `### Activity Thresholds\n`;
  md += `| Signal | Score |\n|--------|------:|\n`;
  md += `| Explicit Task #N reference | 30 |\n| Non-trivial task description | 22 |\n| Monitoring/looking/idle phrase | 12 |\n| Null / very short | 0–5 |\n\n`;

  // Per-agent detail
  md += `## Agent Detail\n\n`;
  for (const r of sorted) {
    md += `### ${r.name} — ${r.score}/100 (${r.grade})\n`;
    md += `- **Role**: ${r.role}\n`;
    md += `- **Status**: ${r.signals.status}\n`;
    md += `- **Heartbeat age**: ${r.signals.heartbeat_age_ms !== null ? Math.round(r.signals.heartbeat_age_ms/1000) + 's' : 'n/a'}\n`;
    md += `- **Last seen**: ${r.signals.lastSeenSecs}s ago\n`;
    md += `- **Unread messages**: ${r.signals.unread_messages}\n`;
    md += `- **Current task**: ${r.signals.current_task || '(none)'}\n\n`;
  }

  return md;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching agent data from', SERVER + '/api/agents ...');

  let agents;
  try {
    agents = await httpGet(SERVER + '/api/agents');
  } catch (e) {
    console.error('API unavailable:', e.message);
    process.exit(1);
  }

  const results = agents.map(scoreAgent);

  // Print to console
  const sorted = [...results].sort((a, b) => b.score - a.score);
  console.log('\n=== Agent Health Scores ===\n');
  for (const r of sorted) {
    const bar = '█'.repeat(Math.round(r.score / 5));
    console.log(`${r.name.padEnd(10)} ${String(r.score).padStart(3)}/100 [${bar.padEnd(20)}] ${r.grade}`);
  }

  const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  console.log(`\nFleet average: ${avg}/100`);

  // Write markdown report
  const reportPath = path.join(__dirname, 'agent_health_scoring.md');
  const md = generateMarkdownReport(results);
  fs.writeFileSync(reportPath, md);
  console.log('\nReport written to:', reportPath);

  // Also write JSON for programmatic use
  const jsonPath = path.join(__dirname, 'agent_health_scores.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log('JSON written to:', jsonPath);
}

main().catch(console.error);
