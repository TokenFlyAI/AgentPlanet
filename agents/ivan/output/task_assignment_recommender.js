#!/usr/bin/env node
/**
 * Task Assignment Recommender — Ivan (ML Engineer)
 *
 * Scores agent-task fit using:
 *   - Role keyword match (semantic similarity proxy)
 *   - Current workload (open tasks already assigned)
 *   - Health score (from health_scores_v2.json)
 *   - Availability (heartbeat recency)
 *
 * Usage:
 *   node task_assignment_recommender.js [--top N] [--unassigned-only]
 *
 * Output:
 *   agents/ivan/output/task_recommendations.json
 *   agents/ivan/output/task_recommendations.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const TASK_BOARD = path.join(ROOT, 'public/task_board.md');
const HEALTH_SCORES = path.join(__dirname, 'health_scores_v2.json');

// --- Role-to-keyword mapping for semantic matching ---
const ROLE_KEYWORDS = {
  alice:   ['architecture','design','planning','review','lead','tech','strategy','coordinate'],
  bob:     ['backend','api','database','server','node','express','rest','endpoint','auth','rate-limit'],
  charlie: ['frontend','ui','html','css','dashboard','react','component','badge','index_lite'],
  dave:    ['fullstack','full-stack','e2e','feature','integration','fix','bug','error','sanitize','path'],
  eve:     ['infra','ci/cd','deploy','docker','kubernetes','pipeline','environment','migration','postgresql'],
  frank:   ['qa','test','spec','playwright','e2e','integration test','assertion','bug'],
  grace:   ['data','pipeline','analytics','etl','schema','metrics','aggregation','timeseries'],
  heidi:   ['security','auth','encryption','jwt','api key','vulnerability','audit','sec','xss','injection'],
  ivan:    ['ml','model','recommendation','prediction','classification','scoring','health','analytics','ai'],
  judy:    ['mobile','ios','android','app','react native','swift','kotlin','push','notification'],
  karl:    ['platform','sdk','library','npm','package','cli','tooling','build','webpack'],
  liam:    ['sre','monitoring','slo','alert','latency','reliability','incident','oncall','uptime'],
  mia:     ['api','rest','graphql','openapi','swagger','spec','endpoint','documentation','schema'],
  nick:    ['performance','profiling','load test','throughput','cache','optimize','websocket','realtime'],
  olivia:  ['quality','review','risk','coordination','planning','tpm','sprint'],
  pat:     ['database','postgresql','migration','schema','query','index','table','sql'],
  quinn:   ['cloud','aws','gcp','azure','iac','terraform','infra','deploy','security'],
  rosa:    ['distributed','microservice','message bus','queue','kafka','event','async','concurrent'],
  sam:     ['velocity','sprint','tracking','coordination','tpm','deadline'],
  tina:    ['qa','test','e2e','playwright','strategy','regression','automation'],
};

// --- Weights for scoring ---
const WEIGHTS = {
  roleMatch:    0.40,   // keyword overlap
  workload:     0.25,   // inverse of current open task count
  health:       0.20,   // from health_scores_v2.json
  availability: 0.15,   // heartbeat recency
};

function loadHealthScores() {
  try {
    const data = JSON.parse(fs.readFileSync(HEALTH_SCORES, 'utf8'));
    const map = {};
    for (const agent of data.agents) {
      map[agent.name] = agent.total; // 0-100
    }
    return map;
  } catch (e) {
    console.warn('[WARN] Could not load health scores, defaulting to 70');
    return {};
  }
}

function loadHeartbeats() {
  const map = {};
  const agents = Object.keys(ROLE_KEYWORDS);
  for (const name of agents) {
    try {
      const hbPath = path.join(AGENTS_DIR, name, 'heartbeat.md');
      const stat = fs.statSync(hbPath);
      const ageMs = Date.now() - stat.mtimeMs;
      map[name] = ageMs; // ms since last heartbeat update
    } catch {
      map[name] = Infinity; // never seen
    }
  }
  return map;
}

function parseTasks() {
  const content = fs.readFileSync(TASK_BOARD, 'utf8');
  const tasks = [];
  for (const line of content.split('\n')) {
    // Format: | id | title | description | priority | assignee | status | ... |
    if (!line.startsWith('|') || line.startsWith('| id') || line.startsWith('| ---')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 6) continue;
    const [id, title, description, priority, assignee, status] = cols;
    if (!id || isNaN(parseInt(id))) continue;
    tasks.push({
      id: parseInt(id),
      title,
      description: description || '',
      priority: (priority || 'medium').toLowerCase(),
      assignee: (assignee || 'unassigned').toLowerCase(),
      status: (status || 'open').toLowerCase(),
    });
  }
  return tasks;
}

function countOpenTasksByAgent(tasks) {
  const counts = {};
  for (const t of tasks) {
    if (t.status === 'open' && t.assignee && t.assignee !== 'unassigned') {
      counts[t.assignee] = (counts[t.assignee] || 0) + 1;
    }
  }
  return counts;
}

function scoreRoleMatch(agentName, task) {
  const keywords = ROLE_KEYWORDS[agentName] || [];
  const text = (task.title + ' ' + task.description).toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits++;
  }
  // Normalize: max possible overlap = keywords.length
  return keywords.length > 0 ? hits / keywords.length : 0;
}

function scoreWorkload(agentName, openCounts) {
  const count = openCounts[agentName] || 0;
  // Score: 1.0 = no tasks, 0.5 = 2 tasks, 0.0 = 5+ tasks
  return Math.max(0, 1 - count * 0.2);
}

function scoreHealth(agentName, healthScores) {
  const h = healthScores[agentName] ?? 70;
  return h / 100;
}

function scoreAvailability(agentName, heartbeats) {
  const ageMs = heartbeats[agentName] ?? Infinity;
  if (ageMs === Infinity) return 0;
  const ageMins = ageMs / 60000;
  // Score: 1.0 = <5m, 0.5 = 15m, 0.0 = 30m+
  return Math.max(0, 1 - ageMins / 30);
}

function recommendForTask(task, agents, healthScores, heartbeats, openCounts) {
  const scores = [];
  for (const agentName of agents) {
    const roleMatch    = scoreRoleMatch(agentName, task);
    const workload     = scoreWorkload(agentName, openCounts);
    const health       = scoreHealth(agentName, healthScores);
    const availability = scoreAvailability(agentName, heartbeats);

    const total =
      roleMatch    * WEIGHTS.roleMatch +
      workload     * WEIGHTS.workload +
      health       * WEIGHTS.health +
      availability * WEIGHTS.availability;

    scores.push({
      agent: agentName,
      total: Math.round(total * 100),
      breakdown: {
        roleMatch:    Math.round(roleMatch * 100),
        workload:     Math.round(workload * 100),
        health:       Math.round(health * 100),
        availability: Math.round(availability * 100),
      },
    });
  }
  return scores.sort((a, b) => b.total - a.total);
}

function formatGrade(score) {
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function main() {
  const args = process.argv.slice(2);
  const topN = parseInt(args[args.indexOf('--top') + 1] || '3');
  const unassignedOnly = args.includes('--unassigned-only');

  console.log('[INFO] Task Assignment Recommender — Ivan ML Engine');
  console.log(`[INFO] Top-${topN} recommendations per task`);

  const healthScores = loadHealthScores();
  const heartbeats   = loadHeartbeats();
  const tasks        = parseTasks();
  const openCounts   = countOpenTasksByAgent(tasks);

  // Filter to open tasks; optionally only unassigned
  const openTasks = tasks.filter(t => {
    if (t.status !== 'open') return false;
    if (unassignedOnly && t.assignee !== 'unassigned') return false;
    return true;
  });

  const agents = Object.keys(ROLE_KEYWORDS);

  console.log(`[INFO] Analyzing ${openTasks.length} open tasks across ${agents.length} agents`);

  const results = [];
  for (const task of openTasks) {
    const rankings = recommendForTask(task, agents, healthScores, heartbeats, openCounts);
    const topRecos = rankings.slice(0, topN);
    const currentAssignee = task.assignee !== 'unassigned' ? task.assignee : null;
    const currentRank = currentAssignee
      ? rankings.findIndex(r => r.agent === currentAssignee) + 1
      : null;

    results.push({
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      currentAssignee: task.assignee,
      currentAssigneeRank: currentRank,
      recommendations: topRecos,
    });
  }

  // Write JSON output
  const jsonOutput = {
    generated: new Date().toISOString(),
    model: 'task-assignment-recommender-v1.0',
    weights: WEIGHTS,
    openTaskCount: openTasks.length,
    results,
  };
  fs.writeFileSync(
    path.join(__dirname, 'task_recommendations.json'),
    JSON.stringify(jsonOutput, null, 2)
  );

  // Write markdown report
  let md = `# Task Assignment Recommendations\n\n`;
  md += `**Generated:** ${jsonOutput.generated}\n`;
  md += `**Model:** task-assignment-recommender-v1.0\n`;
  md += `**Weights:** Role Match 40% | Workload 25% | Health 20% | Availability 15%\n\n`;
  md += `## Open Tasks (${openTasks.length})\n\n`;

  // Summary table
  md += `| Task | Priority | Current Assignee | Top Recommendation | Fit Score |\n`;
  md += `|------|----------|-----------------|--------------------|-----------|\n`;
  for (const r of results) {
    const top = r.recommendations[0];
    const fitGrade = formatGrade(top.total);
    const mismatch = r.currentAssignee !== 'unassigned' && r.currentAssigneeRank > 1
      ? ` ⚠️ (curr rank: #${r.currentAssigneeRank})`
      : '';
    md += `| #${r.taskId}: ${r.title.substring(0, 40)} | ${r.priority} | ${r.currentAssignee} | **${top.agent}** (${fitGrade}: ${top.total}/100)${mismatch} | ${top.total}/100 |\n`;
  }

  // Detailed breakdowns
  md += `\n## Detailed Breakdowns\n\n`;
  for (const r of results) {
    md += `### Task #${r.taskId}: ${r.title}\n`;
    md += `**Priority:** ${r.priority} | **Current:** ${r.currentAssignee}\n\n`;
    md += `| Rank | Agent | Total | Role Match | Workload | Health | Avail |\n`;
    md += `|------|-------|-------|-----------|---------|--------|-------|\n`;
    for (let i = 0; i < r.recommendations.length; i++) {
      const rec = r.recommendations[i];
      const marker = r.currentAssignee === rec.agent ? ' ✓' : '';
      md += `| ${i + 1}${marker} | ${rec.agent} | **${rec.total}** | ${rec.breakdown.roleMatch} | ${rec.breakdown.workload} | ${rec.breakdown.health} | ${rec.breakdown.availability} |\n`;
    }
    md += '\n';
  }

  // Mismatch analysis
  const mismatches = results.filter(r =>
    r.currentAssignee !== 'unassigned' && r.currentAssigneeRank !== null && r.currentAssigneeRank > 1
  );
  if (mismatches.length > 0) {
    md += `## Potential Mismatches (${mismatches.length})\n\n`;
    md += `Tasks where the current assignee is NOT the top recommendation:\n\n`;
    for (const r of mismatches) {
      const top = r.recommendations[0];
      md += `- **#${r.taskId}** ${r.title}: assigned to **${r.currentAssignee}** (rank #${r.currentAssigneeRank}), best fit = **${top.agent}** (${top.total}/100)\n`;
    }
    md += '\n';
  }

  // Workload distribution
  md += `## Current Agent Workload\n\n`;
  md += `| Agent | Open Tasks | Health Score |\n`;
  md += `|-------|------------|-------------|\n`;
  for (const agent of agents.sort()) {
    const count = openCounts[agent] || 0;
    const health = healthScores[agent] ?? 70;
    md += `| ${agent} | ${count} | ${health}/100 |\n`;
  }

  fs.writeFileSync(path.join(__dirname, 'task_recommendations.md'), md);

  // Console summary
  console.log('\n[RESULT] Task Assignment Recommendations:');
  for (const r of results) {
    const top = r.recommendations[0];
    const mismatch = r.currentAssignee !== 'unassigned' && r.currentAssigneeRank > 1 ? ' ⚠️ MISMATCH' : '';
    console.log(`  Task #${r.taskId} (${r.priority}): ${r.title.substring(0, 45)}`);
    console.log(`    Current: ${r.currentAssignee} | Best fit: ${top.agent} (${top.total}/100)${mismatch}`);
  }

  if (mismatches.length > 0) {
    console.log(`\n[WARN] ${mismatches.length} potential task assignment mismatches detected`);
  }

  console.log(`\n[INFO] Output written:`);
  console.log(`  agents/ivan/output/task_recommendations.json`);
  console.log(`  agents/ivan/output/task_recommendations.md`);
}

main();
