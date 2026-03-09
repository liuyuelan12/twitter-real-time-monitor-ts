import * as fs from "fs";
import * as path from "path";
import { config as loadDotenv } from "dotenv";
import { AppConfig, MonitorsFile } from "./types";
import { logger } from "./utils/logger";

loadDotenv();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function loadMonitorsFile(): MonitorsFile {
  const filePath = path.resolve(process.cwd(), "config", "monitors.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Monitors config file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as MonitorsFile;

  if (!Array.isArray(parsed.monitors) || parsed.monitors.length === 0) {
    throw new Error("monitors.json must contain a non-empty 'monitors' array");
  }

  return parsed;
}

export function loadConfig(): AppConfig {
  const authToken = requireEnv("AUTH_TOKEN");
  const ct0 = requireEnv("CT0");
  const botToken = requireEnv("BOT_TOKEN");
  const defaultChatId = process.env.CHAT_ID ?? "";

  const monitorsFile = loadMonitorsFile();

  const monitors = monitorsFile.monitors.map((m) => ({
    ...m,
    telegramChatId: m.telegramChatId || defaultChatId,
  }));

  const enabledCount = monitors.filter((m) => m.enabled).length;
  logger.info(`Loaded config: ${enabledCount}/${monitors.length} monitors enabled, polling every ${monitorsFile.pollingIntervalMs}ms`);

  return {
    authToken,
    ct0,
    botToken,
    defaultChatId,
    monitors,
    pollingIntervalMs: monitorsFile.pollingIntervalMs ?? 60000,
  };
}
