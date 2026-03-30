#!/usr/bin/env node
/**
 * activity_report.js — Grace (Data Engineer)
 * Task #111: Agent Activity Analytics — Cron Trend Report
 *
 * Generates a daily HTML report of agent activity:
 *   - Tasks done, in-progress, open breakdown
 *   - Per-agent cost and cycle counts
 *   - Health trend (heartbeat age, stale alerts)
 *   - Top spenders and efficiency metrics
 *
 * Usage:
 *   node activity_report.js [--port 3199] [--out ./output/activity_report.html]
 *
 * For cron (daily at 08:00):
 *   0 8 * * * node /path/to/activity_report.js >> /tmp/activity_report.log 2>&1
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT    = process.argv.includes('--port')
  ? parseInt(process.argv[process.argv.indexOf('--port') + 1], 10)
  : 3199;

const OUT_DIR = path.resolve(__dirname);
const outArg  = process.argv.indexOf('--out');
const OUT_FILE = outArg !== -1
  ? path.resolve(process.argv[outArg + 1])
  : path.join(OUT_DIR, 'activity_report.html');

const BASE = `http://localhost:${PORT}`;

// ── HTTP helper ───────────────────────────────────────────────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

// ── Formatting helpers ────────────────────────────────────────────────────────
function fmt_usd(n) { return `$${(n || 0).toFixed(2)}`; }
function fmt_ms(ms) {
  if (ms == null) return 'N/A';
  const s = ms / 1000;
  if (s < 60)   return `${s.toFixed(0)}s`;
  if (s < 3600) return `${(s/60).toFixed(1)}m`;
  return `${(s/3600).toFixed(1)}h`;
}
function ago_class(ms) {
  if (ms == null) return 'status-unknown';
  if (ms < 120_000)  return 'status-ok';      // < 2m — fresh
  if (ms < 600_000)  return 'status-warn';    // < 10m — slightly stale
  return 'status-stale';                       // ≥ 10m — stale
}
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[activity_report] Fetching data from ${BASE}...`);

  let costData, metricsData, agentsData;
  try {
    [costData, metricsData, agentsData] = await Promise.all([
      get(`${BASE}/api/cost`),
      get(`${BASE}/api/metrics`),
      get(`${BASE}/api/agents`),
    ]);
  } catch (err) {
    console.error('[activity_report] ERROR fetching data:', err.message);
    process.exit(1);
  }

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // ── Merge agent data ──────────────────────────────────────────────────────
  const agentMap = {};
  (agentsData || []).forEach(a => { agentMap[a.name] = a; });

  // Cost per agent (today)
  const costMap = {};
  (costData.per_agent || []).forEach(c => { costMap[c.name] = c; });

  // Agent list sorted by cost desc
  const allNames = [...new Set([
    ...(agentsData || []).map(a => a.name),
    ...(costData.per_agent || []).map(c => c.name),
  ])];
  allNames.sort((a, b) => {
    const ca = (costMap[a] || {}).today_usd || 0;
    const cb = (costMap[b] || {}).today_usd || 0;
    return cb - ca;
  });

  // ── Health alerts ────────────────────────────────────────────────────────
  const staleAgents = allNames.filter(n => {
    const a = agentMap[n];
    return a && a.heartbeat_age_ms != null && a.heartbeat_age_ms >= 600_000;
  });
  const topSpender = costData.per_agent && costData.per_agent[0];
  const avgCostPerCycle = costData.today_cycles > 0
    ? costData.today_usd / costData.today_cycles
    : 0;

  // ── Task stats ───────────────────────────────────────────────────────────
  const tasks = metricsData.tasks || {};
  const tasksByAssignee = tasks.by_assignee || {};
  const topAssignees = Object.entries(tasksByAssignee)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // ── Build HTML ────────────────────────────────────────────────────────────
  const agentRows = allNames.map(name => {
    const a   = agentMap[name]  || {};
    const c   = costMap[name]   || {};
    const hms = a.heartbeat_age_ms;
    const cls = ago_class(hms);
    const efficiency = c.today_cycles > 0
      ? fmt_usd(c.today_usd / c.today_cycles)
      : 'N/A';
    return `
    <tr class="${cls}">
      <td><strong>${esc(name)}</strong></td>
      <td>${esc(a.role || '—')}</td>
      <td class="num">${c.today_cycles || 0}</td>
      <td class="num cost">${fmt_usd(c.today_usd)}</td>
      <td class="num">${efficiency}/cycle</td>
      <td class="${cls}">${fmt_ms(hms)}</td>
      <td class="num">${a.unread_messages != null ? a.unread_messages : '—'}</td>
    </tr>`;
  }).join('');

  const assigneeRows = topAssignees.map(([name, count]) =>
    `<tr><td>${esc(name)}</td><td class="num">${count}</td></tr>`
  ).join('');

  const alertsHtml = staleAgents.length === 0
    ? '<p class="ok">All agents reporting fresh heartbeats (&lt;10m).</p>'
    : `<ul>${staleAgents.map(n =>
        `<li class="alert-stale">⚠ <strong>${esc(n)}</strong> — heartbeat age: ${fmt_ms((agentMap[n] || {}).heartbeat_age_ms)}</li>`
      ).join('')}</ul>`;

  const completionPct = tasks.completion_rate_pct != null
    ? tasks.completion_rate_pct
    : (tasks.total > 0 ? Math.round(((tasks.by_status || {}).done || 0) / tasks.total * 100) : 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tokenfly Agent Activity Report — ${dateStr}</title>
<style>
  :root {
    --bg: #0f1117;
    --card: #1a1d27;
    --border: #2a2d3e;
    --text: #e2e8f0;
    --muted: #718096;
    --green: #48bb78;
    --yellow: #ecc94b;
    --red: #fc8181;
    --blue: #63b3ed;
    --purple: #b794f4;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; padding: 24px; }
  h1 { font-size: 1.6rem; color: var(--blue); margin-bottom: 4px; }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
  .card .label { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .card .value { font-size: 1.8rem; font-weight: 700; }
  .card .sub   { color: var(--muted); font-size: 0.8rem; margin-top: 4px; }
  .green { color: var(--green); }
  .yellow { color: var(--yellow); }
  .red { color: var(--red); }
  .blue { color: var(--blue); }
  .purple { color: var(--purple); }
  section { margin-bottom: 32px; }
  section h2 { font-size: 1.1rem; color: var(--blue); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  th { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: .05em; background: var(--card); }
  tr:hover td { background: rgba(99,179,237,0.05); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .cost { color: var(--yellow); font-weight: 600; }
  /* heartbeat status */
  .status-ok    td:nth-child(6) { color: var(--green); }
  .status-warn  td:nth-child(6) { color: var(--yellow); }
  .status-stale td:nth-child(6) { color: var(--red); }
  .status-unknown td:nth-child(6) { color: var(--muted); }
  .ok { color: var(--green); }
  .alert-stale { color: var(--red); margin: 4px 0 4px 16px; }
  .bar-wrap { background: var(--border); border-radius: 4px; height: 8px; margin-top: 4px; }
  .bar { height: 8px; border-radius: 4px; background: var(--green); }
  .footer { color: var(--muted); font-size: 0.75rem; text-align: center; margin-top: 32px; border-top: 1px solid var(--border); padding-top: 16px; }
</style>
</head>
<body>

<h1>Tokenfly Agent Activity Report</h1>
<p class="subtitle">Generated: ${esc(dateStr)} &nbsp;|&nbsp; Source: ${esc(BASE)}</p>

<!-- Summary KPIs -->
<div class="grid">
  <div class="card">
    <div class="label">Today's Spend</div>
    <div class="value yellow">${fmt_usd(costData.today_usd)}</div>
    <div class="sub">${costData.today_cycles || 0} cycles total</div>
  </div>
  <div class="card">
    <div class="label">7-Day Spend</div>
    <div class="value purple">${fmt_usd(costData.total_7d_usd)}</div>
    <div class="sub">${costData.total_7d_cycles || 0} cycles</div>
  </div>
  <div class="card">
    <div class="label">Avg Cost/Cycle</div>
    <div class="value blue">${fmt_usd(avgCostPerCycle)}</div>
    <div class="sub">today avg</div>
  </div>
  <div class="card">
    <div class="label">Task Completion</div>
    <div class="value ${completionPct >= 70 ? 'green' : completionPct >= 40 ? 'yellow' : 'red'}">${completionPct}%</div>
    <div class="bar-wrap"><div class="bar" style="width:${completionPct}%"></div></div>
    <div class="sub">${(tasks.by_status || {}).done || 0} done / ${tasks.total || 0} total</div>
  </div>
  <div class="card">
    <div class="label">Active Agents</div>
    <div class="value green">${(metricsData.agents || {}).running || 0}</div>
    <div class="sub">${staleAgents.length > 0 ? `${staleAgents.length} stale` : 'all healthy'}</div>
  </div>
  <div class="card">
    <div class="label">Top Spender</div>
    <div class="value red">${topSpender ? esc(topSpender.name) : '—'}</div>
    <div class="sub">${topSpender ? fmt_usd(topSpender.today_usd) : ''} today</div>
  </div>
</div>

<!-- Task Breakdown -->
<section>
  <h2>Task Breakdown</h2>
  <div class="grid">
    <div class="card">
      <div class="label">Open</div>
      <div class="value red">${(tasks.by_status || {}).open || 0}</div>
    </div>
    <div class="card">
      <div class="label">In Progress</div>
      <div class="value yellow">${(tasks.by_status || {}).in_progress || 0}</div>
    </div>
    <div class="card">
      <div class="label">Done</div>
      <div class="value green">${(tasks.by_status || {}).done || 0}</div>
    </div>
    <div class="card">
      <div class="label">High Priority</div>
      <div class="value red">${(tasks.by_priority || {}).high || 0}</div>
    </div>
    <div class="card">
      <div class="label">Medium Priority</div>
      <div class="value yellow">${(tasks.by_priority || {}).medium || 0}</div>
    </div>
    <div class="card">
      <div class="label">Low Priority</div>
      <div class="value green">${(tasks.by_priority || {}).low || 0}</div>
    </div>
  </div>

  <h2 style="margin-top:20px">Tasks by Assignee (top 10)</h2>
  <table>
    <thead><tr><th>Agent</th><th class="num">Tasks</th></tr></thead>
    <tbody>${assigneeRows}</tbody>
  </table>
</section>

<!-- Agent Activity Table -->
<section>
  <h2>Agent Activity — Today</h2>
  <table>
    <thead>
      <tr>
        <th>Agent</th>
        <th>Role</th>
        <th class="num">Cycles</th>
        <th class="num">Cost</th>
        <th class="num">Efficiency</th>
        <th>Heartbeat Age</th>
        <th class="num">Unread Msgs</th>
      </tr>
    </thead>
    <tbody>${agentRows}</tbody>
  </table>
</section>

<!-- Health Alerts -->
<section>
  <h2>Health Alerts</h2>
  ${alertsHtml}
</section>

<div class="footer">
  Tokenfly Agent Activity Report &nbsp;|&nbsp; Grace (Data Engineer) &nbsp;|&nbsp; Task #111
  &nbsp;|&nbsp; Run: <code>node activity_report.js [--port 3199] [--out report.html]</code>
  &nbsp;|&nbsp; Cron: <code>0 8 * * * node /path/to/activity_report.js</code>
</div>

</body>
</html>`;

  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log(`[activity_report] Report written to: ${OUT_FILE}`);
  console.log(`[activity_report] Summary: ${allNames.length} agents, ${fmt_usd(costData.today_usd)} today, ${completionPct}% task completion`);
  if (staleAgents.length > 0) {
    console.warn(`[activity_report] ALERT: ${staleAgents.length} stale agent(s): ${staleAgents.join(', ')}`);
  }
}

main().catch(err => {
  console.error('[activity_report] Fatal:', err);
  process.exit(1);
});
