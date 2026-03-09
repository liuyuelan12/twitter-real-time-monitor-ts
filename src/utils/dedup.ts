import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

const DATA_DIR = path.resolve(process.cwd(), "data");
const SEEN_FILE = path.join(DATA_DIR, "seen_tweets.json");
const MAX_SIZE = 10000;
const PERSIST_INTERVAL_MS = 60_000;

let seenIds: Set<string> = new Set();
let persistTimer: NodeJS.Timeout | null = null;

export function loadSeenTweets(): void {
  try {
    if (fs.existsSync(SEEN_FILE)) {
      const raw = fs.readFileSync(SEEN_FILE, "utf-8");
      const ids: string[] = JSON.parse(raw);
      seenIds = new Set(ids);
      logger.info(`Loaded ${seenIds.size} seen tweet IDs from disk`);
    }
  } catch (err) {
    logger.warn("Failed to load seen tweets, starting fresh", {
      error: err instanceof Error ? err.message : String(err),
    });
    seenIds = new Set();
  }
}

export function persistSeenTweets(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const ids = Array.from(seenIds);
    fs.writeFileSync(SEEN_FILE, JSON.stringify(ids), "utf-8");
    logger.debug(`Persisted ${ids.length} seen tweet IDs to disk`);
  } catch (err) {
    logger.error("Failed to persist seen tweets", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function hasSeenTweet(tweetId: string): boolean {
  return seenIds.has(tweetId);
}

export function markTweetSeen(tweetId: string): void {
  seenIds.add(tweetId);

  // Trim if over max size - remove oldest entries
  if (seenIds.size > MAX_SIZE) {
    const ids = Array.from(seenIds);
    const toRemove = ids.slice(0, ids.length - MAX_SIZE);
    for (const id of toRemove) {
      seenIds.delete(id);
    }
  }
}

export function startPeriodicPersist(): void {
  if (persistTimer) return;
  persistTimer = setInterval(persistSeenTweets, PERSIST_INTERVAL_MS);
  persistTimer.unref();
}

export function stopPeriodicPersist(): void {
  if (persistTimer) {
    clearInterval(persistTimer);
    persistTimer = null;
  }
}
