import { execSync } from "child_process";
import { platform } from "os";

const PORTS = [3000, 5173];

/**
 * Kills processes running on specific ports across Windows, macOS, and Linux.
 */
function killPorts(ports: number[]): void {
  const isWindows = platform() === "win32";

  ports.forEach((port) => {
    try {
      let pid: string | null = null;

      if (isWindows) {
        // Windows: netstat -ano | findstr :PORT
        const output = execSync(`netstat -ano | findstr :${port}`).toString();
        const lines = output
          .split("\n")
          .filter((line) => line.includes("LISTENING"));
        if (lines.length > 0) {
          // The PID is the last element in the netstat output line
          const parts = lines[0].trim().split(/\s+/);
          pid = parts[parts.length - 1];
        }
      } else {
        // Unix (macOS/Linux): lsof -i tcp:PORT -t
        pid = execSync(`lsof -i tcp:${port} -t`).toString().trim();
      }

      if (pid) {
        console.log(`Found process ${pid} on port ${port}. Killing...`);
        if (isWindows) {
          execSync(`taskkill /F /PID ${pid}`);
        } else {
          execSync(`kill -9 ${pid}`);
        }
        console.log(`Port ${port} is now free.`);
      } else {
        console.log(`No process found on port ${port}.`);
      }
    } catch (error) {
      // execSync throws if no process is found on that port
      console.log(`Port ${port} is already free or access was denied.`);
    }
  });
}

killPorts(PORTS);
