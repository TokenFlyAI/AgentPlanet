/**
 * Agent Health Scoring Model — Prototype
 * Ivan (ML Engineer), Task #46
 *
 * Scores each agent 0-100 across 5 dimensions:
 *   Liveness       (0-30): Is the agent alive and recently seen?
 *   Activity       (0-25): Is the agent actively doing work?
 *   Inbox Pressure (0-20): Is the agent keeping up with messages?
 *   Heartbeat      (0-15): Is the heartbeat file fresh?
 *   Error Status   (0-10): No auth or critical errors?
 */

'use strict';

const http = require('http');

// ── Scoring helpers ──────────────────────────────────────────────────────────

function scoreLiveness(agent) {
  if (!agent.alive) return 0;
  const secs = agent.lastSeenSecs ?? Infinity;
  if (secs < 60)   return 30;
  if (secs < 300)  return 20;
  if (secs < 900)  return 10;
  return 5;
}

function scoreActivity(agent) {
  const task = agent.current_task;
  if (!task) return 5;
  // Positive signals in task text
  const hasActiveVerb = /working|running|building|implementing|started|session \d+/i.test(task);
  if (hasActiveVerb) return 25;
  // Task exists but looks complete or vague
  const isComplete = /complete|done|shipped|looking for next/i.test(task);
  if (isComplete) return 15;
  return 18; // task set, unclear state
}

function scoreInbox(agent) {
  const unread = agent.unread_messages ?? 0;
  if (unread === 0)  return 20;
  if (unread <= 5)   return 17;
  if (unread <= 15)  return 13;
  if (unread <= 30)  return 9;
  if (unread <= 60)  return 4;
  return 0; // > 60 — seriously backlogged
}

function scoreHeartbeat(agent) {
  const age = agent.heartbeat_age_ms;
  if (age == null) return 8;          // no heartbeat file — neutral
  const mins = age / 60000;
  if (mins < 10)   return 15;
  if (mins < 30)   return 12;
  if (mins < 60)   return 8;
  if (mins < 120)  return 4;
  return 0;
}

function scoreErrors(agent) {
  return agent.auth_error ? 0 : 10;
}

function computeHealth(agent) {
  const liveness  = scoreLiveness(agent);
  const activity  = scoreActivity(agent);
  const inbox     = scoreInbox(agent);
  const heartbeat = scoreHeartbeat(agent);
  const errors    = scoreErrors(agent);
  const total     = liveness + activity + inbox + heartbeat + errors;

  return {
    name:       agent.name,
    role:       agent.role,
    score:      total,
    grade:      gradeFromScore(total),
    breakdown:  { liveness, activity, inbox, heartbeat, errors },
    status:     agent.status,
    alive:      agent.alive,
    lastSeenSecs: agent.lastSeenSecs,
    unread:     agent.unread_messages,
    heartbeat_age_mins: agent.heartbeat_age_ms != null
      ? Math.round(agent.heartbeat_age_ms / 60000)
      : null,
    current_task_snippet: (agent.current_task || '').slice(0, 80) || null,
  };
}

function gradeFromScore(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ── Fetch from dashboard API ─────────────────────────────────────────────────

function fetchAgents() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3199/api/agents', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let agents;
  try {
    agents = await fetchAgents();
  } catch (e) {
    console.error('Could not reach dashboard API:', e.message);
    process.exit(1);
  }

  const results = agents.map(computeHealth);
  results.sort((a, b) => b.score - a.score);

  // Summary stats
  const scores = results.map(r => r.score);
  const avg    = (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
  const min    = Math.min(...scores);
  const max    = Math.max(...scores);

  // Console output
  console.log('\n=== AGENT HEALTH SCORES ===\n');
  console.log('Rank  Agent       Score  Grade  Liveness  Activity  Inbox  Heartbeat  Errors');
  console.log('─'.repeat(82));
  results.forEach((r, i) => {
    const b = r.breakdown;
    console.log(
      String(i + 1).padStart(4) + '  ' +
      r.name.padEnd(10) + '  ' +
      String(r.score).padStart(5) + '  ' +
      r.grade.padStart(5) + '  ' +
      String(b.liveness).padStart(8) + '  ' +
      String(b.activity).padStart(8) + '  ' +
      String(b.inbox).padStart(5) + '  ' +
      String(b.heartbeat).padStart(9) + '  ' +
      String(b.errors).padStart(6)
    );
  });
  console.log('─'.repeat(82));
  console.log(`\nTeam Average: ${avg}  |  Min: ${min}  |  Max: ${max}`);

  // Grade distribution
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  results.forEach(r => dist[r.grade]++);
  console.log('\nGrade Distribution:', JSON.stringify(dist));

  // Agents needing attention
  const atRisk = results.filter(r => r.score < 55);
  if (atRisk.length) {
    console.log('\n⚠ Agents below C threshold (score < 55):');
    atRisk.forEach(r => console.log(`  - ${r.name} (${r.score}) — inbox: ${r.unread}, task: ${r.current_task_snippet || 'none'}`));
  }

  return { results, summary: { avg: parseFloat(avg), min, max, distribution: dist } };
}

main().then(data => {
  // Export for use by other modules
  if (require.main === module) return;
  module.exports = data;
}).catch(e => {
  console.error(e);
  process.exit(1);
});
