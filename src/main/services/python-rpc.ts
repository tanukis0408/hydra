import axios from "axios";
import http from "node:http";
import getPort, { portNumbers } from "get-port";

import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { pythonRpcLogger } from "./logger";
import { Readable } from "node:stream";
import { app, dialog } from "electron";
import { db, levelKeys } from "@main/level";

interface GamePayload {
  action: string;
  game_id: string;
  url: string | string[];
  save_path: string;
  header?: string;
  out?: string;
  total_size?: number;
}

const binaryNameByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  darwin: "hydra-python-rpc",
  linux: "hydra-python-rpc",
  win32: "hydra-python-rpc.exe",
};

const binaryFolderCandidates = ["hydra-python-rpc", "kraken-python-rpc"];
const pythonExecutableCandidates =
  process.platform === "win32" ? ["python"] : ["python3", "python"];

const RPC_PORT_RANGE_START = 8080;
const RPC_PORT_RANGE_END = 9000;
const DEFAULT_RPC_PORT = 8084;
const HEALTH_CHECK_INTERVAL_MS = 100;
const HEALTH_CHECK_TIMEOUT_MS = 10000;

export class PythonRPC {
  public static readonly BITTORRENT_PORT = "5881";

  public static readonly rpc = axios.create({
    baseURL: `http://localhost:${DEFAULT_RPC_PORT}`,
    httpAgent: new http.Agent({
      family: 4, // Force IPv4
    }),
  });

  private static pythonProcess: cp.ChildProcess | null = null;

  private static logStderr(readable: Readable | null) {
    if (!readable) return;

    readable.setEncoding("utf-8");
    readable.on("data", pythonRpcLogger.log);
  }

  private static async getRPCPassword() {
    const existingPassword = await db.get(levelKeys.rpcPassword, {
      valueEncoding: "utf8",
    });

    if (existingPassword) return existingPassword;

    const newPassword = crypto.randomBytes(32).toString("hex");

    await db.put(levelKeys.rpcPassword, newPassword, {
      valueEncoding: "utf8",
    });

    return newPassword;
  }

  private static async waitForHealthCheck(): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT_MS) {
      try {
        const response = await this.rpc.get("/healthcheck", { timeout: 1000 });
        if (response.status === 200) {
          pythonRpcLogger.log("RPC health check passed");
          return;
        }
      } catch {
        // Server not ready yet, continue polling
      }
      await new Promise((resolve) =>
        setTimeout(resolve, HEALTH_CHECK_INTERVAL_MS)
      );
    }

    throw new Error("RPC health check timed out");
  }

  private static resolveBinaryPath(binaryName: string): string | null {
    for (const folder of binaryFolderCandidates) {
      const candidate = path.join(process.resourcesPath, folder, binaryName);
      if (fs.existsSync(candidate)) return candidate;
    }

    return null;
  }

  private static async spawnPythonFromResources(commonArgs: string[]) {
    const scriptPath = path.join(process.resourcesPath, "python_rpc", "main.py");

    if (!fs.existsSync(scriptPath)) {
      return null;
    }

    for (const pythonCommand of pythonExecutableCandidates) {
      const childProcess = cp.spawn(pythonCommand, [scriptPath, ...commonArgs], {
        windowsHide: true,
        stdio: ["inherit", "inherit"],
      });

      const spawned = await new Promise<boolean>((resolve) => {
        childProcess.once("spawn", () => resolve(true));
        childProcess.once("error", () => resolve(false));
      });

      if (spawned) {
        this.logStderr(childProcess.stderr);
        return childProcess;
      }
    }

    return null;
  }

  public static async spawn(
    initialDownload?: GamePayload,
    initialSeeding?: GamePayload[]
  ) {
    const rpcPassword = await this.getRPCPassword();

    const port = await getPort({
      port: [
        DEFAULT_RPC_PORT,
        ...portNumbers(RPC_PORT_RANGE_START, RPC_PORT_RANGE_END),
      ],
    });

    this.rpc.defaults.baseURL = `http://localhost:${port}`;
    pythonRpcLogger.log(`Using RPC port: ${port}`);

    const commonArgs = [
      this.BITTORRENT_PORT,
      String(port),
      rpcPassword,
      initialDownload ? JSON.stringify(initialDownload) : "",
      initialSeeding ? JSON.stringify(initialSeeding) : "",
    ];

    if (app.isPackaged) {
      const binaryName = binaryNameByPlatform[process.platform]!;
      const binaryPath = this.resolveBinaryPath(binaryName);

      if (!binaryPath) {
        const fallbackProcess = await this.spawnPythonFromResources(commonArgs);
        if (fallbackProcess) {
          this.pythonProcess = fallbackProcess;
          this.rpc.defaults.headers.common["x-hydra-rpc-password"] = rpcPassword;
          await this.waitForHealthCheck();
          pythonRpcLogger.log(
            `Python RPC started (script fallback) on port ${port}`
          );
          return;
        }

        dialog.showErrorBox(
          "Download service unavailable",
          "Kraken couldn't start the Python download service.\n\n" +
            "The bundled binary is missing (often removed by Windows Defender).\n" +
            "Reinstall Kraken or allow the binary, or install Python to use the fallback.\n\n" +
            "You can still use the app, but downloads and torrents will be disabled."
        );

        pythonRpcLogger.error("Python RPC binary missing; running in fallback-free mode.");
        return;
      }

      const childProcess = cp.spawn(binaryPath, commonArgs, {
        windowsHide: true,
        stdio: ["inherit", "inherit"],
      });

      this.logStderr(childProcess.stderr);
      this.pythonProcess = childProcess;
    } else {
      const scriptPath = path.join(
        __dirname,
        "..",
        "..",
        "python_rpc",
        "main.py"
      );

      const childProcess = cp.spawn("python", [scriptPath, ...commonArgs], {
        stdio: ["inherit", "inherit"],
      });

      this.logStderr(childProcess.stderr);
      this.pythonProcess = childProcess;
    }

    this.rpc.defaults.headers.common["x-hydra-rpc-password"] = rpcPassword;

    try {
      await this.waitForHealthCheck();
      pythonRpcLogger.log(`Python RPC started successfully on port ${port}`);
    } catch (err) {
      pythonRpcLogger.log(`Failed to start Python RPC: ${err}`);
      dialog.showErrorBox(
        "RPC Error",
        `Failed to start download service.\n\nThe service did not respond in time. Please try restarting Kraken.`
      );
      this.kill();
      throw err;
    }
  }

  public static kill() {
    if (this.pythonProcess) {
      pythonRpcLogger.log("Killing python process");
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}
