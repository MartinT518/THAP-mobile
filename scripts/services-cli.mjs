#!/usr/bin/env node
/**
 * Orchestrate local stack: Docker MySQL (docker-compose) + pnpm dev.
 * Usage: node scripts/services-cli.mjs start|stop|restart
 */
import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const DEV_PORT_START = 3000;
const DEV_PORT_COUNT = 20;

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

function dockerUp() {
  run("docker compose up -d");
}

function dockerDown() {
  try {
    run("docker compose down");
  } catch {
    // compose may be absent or no stack running
  }
}

function killWindowsDevListeners() {
  const ps = `
$ports = ${DEV_PORT_START}..(${DEV_PORT_START} + ${DEV_PORT_COUNT - 1})
foreach ($p in $ports) {
  Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
`.trim();
  spawnSync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-Command", ps],
    { stdio: "inherit", cwd: root },
  );
}

function killUnixDevListeners() {
  for (let port = DEV_PORT_START; port < DEV_PORT_START + DEV_PORT_COUNT; port++) {
    try {
      const out = execSync(`lsof -ti :${port} -sTCP:LISTEN`, {
        encoding: "utf8",
        cwd: root,
      }).trim();
      if (!out) continue;
      for (const pid of out.split(/\s+/)) {
        if (!/^\d+$/.test(pid)) continue;
        try {
          execSync(`kill -9 ${pid}`, { stdio: "pipe", cwd: root });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* no listener */
    }
  }
}

function killDevListeners() {
  if (process.platform === "win32") {
    killWindowsDevListeners();
  } else {
    killUnixDevListeners();
  }
}

function start() {
  dockerUp();
  run("pnpm dev");
}

function stop() {
  killDevListeners();
  dockerDown();
}

function restart() {
  stop();
  start();
}

const cmd = process.argv[2];
const commands = { start, stop, restart };

if (!cmd || !commands[cmd]) {
  console.error("Usage: node scripts/services-cli.mjs <start|stop|restart>");
  process.exit(1);
}

commands[cmd]();
