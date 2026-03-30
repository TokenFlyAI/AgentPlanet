#!/usr/bin/env node
/**
 * Tokenfly Developer CLI
 * Karl — Platform Engineer
 * Task #47
 *
 * Usage (from aicompany/ root):
 *   node agents/karl/output/dev_cli.js <command> [args...]
 *   ./agents/karl/output/dev_cli.js <command> [args...]
 *
 * Commands:
 *   status                        Show all agents' status in a table
 *   task <id>                     Show details for a specific task
 *   inbox <agent>                 List unread messages in an agent's chat_inbox/
 *   assign <task_id> <agent>      Update task assignee on the task board
 *   done <task_id>                Mark a task as done on the task board
 *   help                          Show this help
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ── Config ────────────────────────────────────────────────────────────────────

// Resolve root dir: this file lives at agents/karl/output/dev_cli.js
const ROOT = path.resolve(__dirname, '../../..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const TASK_BOARD = path.join(ROOT, 'public', 'task_board.md');

// ANSI color helpers
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
const c = (code, text) => NO_COLOR ? text : `${code}${text}${C.reset}`;

// ── Utilities ─────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write(c(C.red, `Error: ${msg}`) + '\n');
  process.exit(1);
}

function padEnd(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

function agentNames() {
  try {
    return fs.readdirSync(AGENTS_DIR)
      .filter(d => fs.statSync(path.join(AGENTS_DIR, d)).isDirectory());
  } catch {
    return [];
  }
}

// ── Task Board Parsing ─────────────────────────────────────────────────────────

function readTaskBoard() {
  if (!fs.existsSync(TASK_BOARD)) die(`Task board not found: ${TASK_BOARD}`);
  return fs.readFileSync(TASK_BOARD, 'utf8');
}

function parseTasks(md) {
  const tasks = [];
  const lines = md.split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map(s => s.trim()).filter((_, i) => i > 0);
    if (cols.length < 6) continue;
    const [id, title, description, priority, assignee, status, created, updated, ...noteCols] = cols;
    if (!/^\d+$/.test(id)) continue; // skip header
    tasks.push({
      id: parseInt(id, 10),
      title,
      description,
      priority: priority || '',
      assignee: assignee || '',
      status: status || '',
      created: created || '',
      updated: updated || '',
      notes: noteCols.join('|').trim() || '',
    });
  }
  return tasks;
}

function writeTaskBoard(md) {
  fs.writeFileSync(TASK_BOARD, md, 'utf8');
}

function updateTaskField(taskId, field, value) {
  const md = readTaskBoard();
  const lines = md.split('\n');
  let found = false;

  // Column order: ID | Title | Description | Priority | Assignee | Status | Created | Updated | Notes
  const fieldIndex = { priority: 3, assignee: 4, status: 5, updated: 7, notes: 8 };
  const colIdx = fieldIndex[field];
  if (colIdx === undefined) die(`Unknown field: ${field}`);

  const result = lines.map(line => {
    if (!line.startsWith('|')) return line;
    const cols = line.split('|');
    // cols[0] = '', cols[1] = ID, cols[2] = Title, ...
    const idStr = cols[1]?.trim();
    if (String(taskId) !== idStr) return line;
    found = true;
    // Update the target column
    cols[colIdx + 1] = ` ${value} `;
    // Update the updated timestamp (col 8 = index 8)
    if (field !== 'updated') {
      cols[8] = ` ${today()} `;
    }
    return cols.join('|');
  });

  if (!found) die(`Task #${taskId} not found on task board`);
  writeTaskBoard(result.join('\n'));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Commands ──────────────────────────────────────────────────────────────────

function cmdStatus() {
  const agents = agentNames();
  if (agents.length === 0) die(`No agents found in ${AGENTS_DIR}`);

  const rows = [];
  for (const name of agents.sort()) {
    const statusFile = path.join(AGENTS_DIR, name, 'status.md');
    const heartbeatFile = path.join(AGENTS_DIR, name, 'heartbeat.md');
    const inboxDir = path.join(AGENTS_DIR, name, 'chat_inbox');

    let lastUpdated = '—';
    let focus = '—';
    let blockers = '—';

    if (fs.existsSync(statusFile)) {
      const text = fs.readFileSync(statusFile, 'utf8');
      // Extract Last Updated
      const updMatch = text.match(/##\s*Last Updated\s*\n([^\n]+)/);
      if (updMatch) lastUpdated = updMatch[1].trim();

      // Extract current task / focus
      const taskMatch = text.match(/##\s*Current Task\s*\n([^\n]+)/);
      if (taskMatch) focus = taskMatch[1].trim().slice(0, 50);

      // Extract blockers
      const blockerMatch = text.match(/##\s*Blocked On\s*\n([^\n]+)/);
      if (blockerMatch && !blockerMatch[1].match(/^[-\s]*$/)) {
        blockers = blockerMatch[1].trim().slice(0, 40);
      }
    }

    // Heartbeat
    let heartbeat = '?';
    if (fs.existsSync(heartbeatFile)) {
      const hb = fs.readFileSync(heartbeatFile, 'utf8').trim();
      const match = hb.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/);
      heartbeat = match ? match[0].replace('T', ' ') : hb.slice(0, 16);
    }

    // Unread inbox
    let unread = 0;
    if (fs.existsSync(inboxDir)) {
      try {
        unread = fs.readdirSync(inboxDir)
          .filter(f => f.endsWith('.md') && !f.startsWith('read_')).length;
      } catch { /* ignore */ }
    }

    rows.push({ name, lastUpdated, focus, blockers, heartbeat, unread });
  }

  // Print table
  const W = { name: 12, heartbeat: 16, unread: 6, focus: 52, blockers: 42 };
  const header =
    c(C.bold + C.cyan, padEnd('AGENT', W.name)) + '  ' +
    c(C.bold + C.cyan, padEnd('HEARTBEAT', W.heartbeat)) + '  ' +
    c(C.bold + C.cyan, padEnd('INBOX', W.unread)) + '  ' +
    c(C.bold + C.cyan, padEnd('FOCUS', W.focus)) + '  ' +
    c(C.bold + C.cyan, padEnd('BLOCKERS', W.blockers));

  const divider = '─'.repeat(W.name + W.heartbeat + W.unread + W.focus + W.blockers + 10);

  console.log(c(C.bold, '\nTokenfly Agent Status'));
  console.log(c(C.gray, divider));
  console.log(header);
  console.log(c(C.gray, divider));

  for (const row of rows) {
    const unreadStr = row.unread > 0
      ? c(C.yellow + C.bold, String(row.unread))
      : c(C.gray, '0');
    const nameStr = c(C.bold, padEnd(row.name, W.name));
    const hbStr = c(C.dim, padEnd(row.heartbeat, W.heartbeat));
    const focusStr = padEnd(row.focus, W.focus);
    const blockersStr = row.blockers === '—'
      ? c(C.gray, padEnd('—', W.blockers))
      : c(C.red, padEnd(row.blockers, W.blockers));

    console.log(`${nameStr}  ${hbStr}  ${padEnd(unreadStr, W.unread + 10)}  ${focusStr}  ${blockersStr}`);
  }

  console.log(c(C.gray, divider));
  console.log(c(C.dim, `\n${agents.length} agents | Run 'dev_cli task <id>' to view a task\n`));
}

function cmdTask(taskId) {
  if (!taskId) die('Usage: dev_cli task <id>');
  const id = parseInt(taskId, 10);
  if (isNaN(id)) die(`Invalid task ID: ${taskId}`);

  const tasks = parseTasks(readTaskBoard());
  const task = tasks.find(t => t.id === id);
  if (!task) die(`Task #${id} not found`);

  const statusColor = {
    open: C.green,
    in_progress: C.yellow,
    done: C.gray,
    blocked: C.red,
    in_review: C.blue,
    cancelled: C.red,
  }[task.status] || C.white;

  const prioColor = {
    critical: C.red,
    high: C.yellow,
    medium: C.cyan,
    low: C.gray,
  }[task.priority] || C.white;

  console.log();
  console.log(c(C.bold + C.cyan, `Task #${task.id} — ${task.title}`));
  console.log(c(C.gray, '─'.repeat(60)));
  console.log(`  ${c(C.bold, 'Status')}:    ${c(statusColor, task.status)}`);
  console.log(`  ${c(C.bold, 'Priority')}:  ${c(prioColor, task.priority)}`);
  console.log(`  ${c(C.bold, 'Assignee')}:  ${task.assignee || c(C.gray, 'unassigned')}`);
  console.log(`  ${c(C.bold, 'Created')}:   ${task.created}`);
  console.log(`  ${c(C.bold, 'Updated')}:   ${task.updated}`);
  if (task.notes) console.log(`  ${c(C.bold, 'Notes')}:     ${task.notes}`);
  console.log();
  console.log(c(C.bold, 'Description:'));
  console.log(`  ${task.description}`);
  console.log();
}

function cmdInbox(agentName) {
  if (!agentName) die('Usage: dev_cli inbox <agent>');
  const inboxDir = path.join(AGENTS_DIR, agentName, 'chat_inbox');

  if (!fs.existsSync(path.join(AGENTS_DIR, agentName))) {
    die(`Unknown agent: ${agentName}. Run 'dev_cli status' to see all agents.`);
  }

  if (!fs.existsSync(inboxDir)) {
    console.log(c(C.dim, `\n${agentName}'s inbox is empty (no chat_inbox/ directory)\n`));
    return;
  }

  const files = fs.readdirSync(inboxDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  const unread = files.filter(f => !f.startsWith('read_'));
  const read = files.filter(f => f.startsWith('read_'));

  console.log();
  console.log(c(C.bold + C.cyan, `Inbox — ${agentName}`));
  console.log(c(C.gray, '─'.repeat(60)));

  if (unread.length === 0) {
    console.log(c(C.green, '  ✓ No unread messages'));
  } else {
    console.log(c(C.bold, `  Unread (${unread.length}):`));
    for (const f of unread) {
      // Parse filename: YYYY_MM_DD_HH_MM_SS_from_sender[_topic].md
      const parts = f.replace('.md', '').split('_');
      let ts = '—', from = '—', topic = '';

      if (parts.length >= 7) {
        ts = `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
        const rest = parts.slice(7); // after timestamp (6 parts) + 'from'
        // Find 'from' index
        const fromIdx = parts.indexOf('from');
        if (fromIdx >= 0 && parts[fromIdx + 1]) {
          from = parts[fromIdx + 1];
          topic = parts.slice(fromIdx + 2).join('_');
        }
      } else {
        from = f.replace('.md', '');
      }

      const filePath = path.join(inboxDir, f);
      const size = fs.statSync(filePath).size;
      const preview = readFirstLine(filePath);

      const topicStr = topic ? c(C.dim, ` [${topic}]`) : '';
      console.log(`    ${c(C.yellow, '●')} ${c(C.bold, from)}${topicStr}`);
      console.log(`      ${c(C.gray, ts)} · ${size} bytes`);
      if (preview) console.log(`      ${c(C.dim, preview.slice(0, 80))}`);
    }
  }

  if (read.length > 0) {
    console.log(c(C.gray, `\n  Archived: ${read.length} message(s)`));
  }
  console.log();
}

function readFirstLine(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').find(l => l.trim() && !l.startsWith('#')) || '';
  } catch {
    return '';
  }
}

function cmdAssign(taskId, agentName) {
  if (!taskId || !agentName) die('Usage: dev_cli assign <task_id> <agent>');
  const id = parseInt(taskId, 10);
  if (isNaN(id)) die(`Invalid task ID: ${taskId}`);

  // Verify agent exists
  if (!fs.existsSync(path.join(AGENTS_DIR, agentName))) {
    die(`Unknown agent: ${agentName}`);
  }

  updateTaskField(id, 'assignee', agentName);
  console.log(c(C.green, `✓ Task #${id} assigned to ${agentName}`));
}

function cmdDone(taskId) {
  if (!taskId) die('Usage: dev_cli done <task_id>');
  const id = parseInt(taskId, 10);
  if (isNaN(id)) die(`Invalid task ID: ${taskId}`);

  updateTaskField(id, 'status', 'done');
  console.log(c(C.green, `✓ Task #${id} marked as done`));
}

function cmdHelp() {
  console.log(`
${c(C.bold + C.cyan, 'Tokenfly Developer CLI')}
${c(C.dim, 'Karl — Platform Engineer | Task #47')}

${c(C.bold, 'USAGE')}
  node agents/karl/output/dev_cli.js <command> [args...]

${c(C.bold, 'COMMANDS')}
  ${c(C.cyan, 'status')}
      Show all agents' current status: heartbeat, unread inbox count, focus, blockers.

  ${c(C.cyan, 'task <id>')}
      Show full details for a specific task by ID.
      Example: dev_cli task 47

  ${c(C.cyan, 'inbox <agent>')}
      List messages in an agent's chat_inbox/. Shows unread vs archived.
      Example: dev_cli inbox alice

  ${c(C.cyan, 'assign <task_id> <agent>')}
      Update the assignee for a task on the task board.
      Example: dev_cli assign 47 bob

  ${c(C.cyan, 'done <task_id>')}
      Mark a task as done on the task board.
      Example: dev_cli done 47

  ${c(C.cyan, 'help, --help, -h')}
      Show this help message.

${c(C.bold, 'ENVIRONMENT')}
  NO_COLOR=1   Disable ANSI colors in output.

${c(C.bold, 'FILES')}
  Root:        ${ROOT}
  Task board:  ${TASK_BOARD}
  Agents dir:  ${AGENTS_DIR}
`);
}

// ── Entry Point ───────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'status':
    cmdStatus();
    break;
  case 'task':
    cmdTask(args[0]);
    break;
  case 'inbox':
    cmdInbox(args[0]);
    break;
  case 'assign':
    cmdAssign(args[0], args[1]);
    break;
  case 'done':
    cmdDone(args[0]);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    cmdHelp();
    break;
  default:
    process.stderr.write(c(C.red, `Unknown command: ${cmd}`) + '\n');
    process.stderr.write('Run with --help to see available commands.\n');
    process.exit(1);
}
