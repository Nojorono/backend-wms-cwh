import { execSync } from 'node:child_process';

/**
 * Dev-only: terminate any process still listening on `port` (e.g. prior nest --watch child).
 * Skips the current process PID so a fresh start is safe.
 */
export function freeDevPort(port: number): void {
  const currentPid = process.pid;

  if (process.platform === 'win32') {
    freeDevPortWindows(port, currentPid);
    return;
  }

  freeDevPortUnix(port, currentPid);
}

function freeDevPortWindows(port: number, currentPid: number): void {
  try {
    const output = execSync('netstat -ano -p tcp', {
      encoding: 'utf8',
      windowsHide: true,
    });

    const suffix = `:${port}`;
    const pids = new Set<number>();

    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) {
        continue;
      }

      const parts = line.trim().split(/\s+/);
      const localAddress = parts[1];
      const pid = Number(parts.at(-1));

      if (!localAddress?.endsWith(suffix) || !Number.isInteger(pid) || pid <= 0 || pid === currentPid) {
        continue;
      }

      pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', windowsHide: true });
      } catch {
        // Process may already have exited
      }
    }
  } catch {
    // Nothing listening on this port
  }
}

function freeDevPortUnix(port: number, currentPid: number): void {
  try {
    const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: 'utf8',
    });

    for (const line of output.split('\n')) {
      const pid = Number(line.trim());
      if (Number.isInteger(pid) && pid > 0 && pid !== currentPid) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          // Process may already have exited
        }
      }
    }
  } catch {
    // Nothing listening on this port
  }
}
