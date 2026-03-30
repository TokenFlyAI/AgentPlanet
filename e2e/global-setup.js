// @ts-check
const { execSync } = require("child_process");

/**
 * Global setup: kill any process using port 3199 before tests start.
 * This ensures a fresh server instance for each test run.
 */
async function globalSetup() {
  try {
    const pids = execSync("lsof -ti :3199 2>/dev/null || true", { encoding: "utf8" }).trim();
    if (pids) {
      for (const pid of pids.split("\n").filter(Boolean)) {
        try { execSync(`kill ${pid}`); } catch (_) {}
      }
      // Wait for port to free
      await new Promise((r) => setTimeout(r, 800));
    }
  } catch (_) {}
}

module.exports = globalSetup;
