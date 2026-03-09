import { loadConfig } from "./config";
import { TwitterService } from "./services/twitterService";
import { TelegramService } from "./services/telegramService";
import { MonitorConfig } from "./types";
import { logger } from "./utils/logger";
import {
  loadSeenTweets,
  persistSeenTweets,
  hasSeenTweet,
  markTweetSeen,
  startPeriodicPersist,
  stopPeriodicPersist,
} from "./utils/dedup";

let isShuttingDown = false;
const activeTimeouts: Set<NodeJS.Timeout> = new Set();

let isFirstRun = true;
let rateLimitRetries = 0;

async function pollMonitor(
  monitor: MonitorConfig,
  twitterService: TwitterService,
  telegramService: TelegramService,
  pollingIntervalMs: number,
): Promise<void> {
  if (isShuttingDown) return;

  try {
    const tweets = await twitterService.fetchLatestTweets(monitor.username);

    if (isFirstRun) {
      // First run: mark all existing tweets as seen, don't forward
      for (const tweet of tweets) {
        markTweetSeen(tweet.id);
      }
      logger.info(`First run: marked ${tweets.length} existing tweets as seen for @${monitor.username}`);
      isFirstRun = false;
    } else {
      let forwarded = 0;
      for (const tweet of tweets) {
        if (hasSeenTweet(tweet.id)) continue;

        // Mark as seen FIRST to prevent duplicate sends
        markTweetSeen(tweet.id);

        try {
          await telegramService.sendTweet(monitor.telegramChatId, tweet);
          forwarded++;
          // Small delay between sends to avoid Telegram rate limit
          await sleep(1500);
        } catch (sendErr: any) {
          logger.error(`Failed to forward tweet ${tweet.id}`, {
            error: sendErr?.message || String(sendErr),
          });
        }
      }

      if (forwarded > 0) {
        logger.info(`Forwarded ${forwarded} new tweets for @${monitor.username}`);
      }
    }
  } catch (err: any) {
    const status = err?.message?.match(/(\d{3})/)?.[1];

    if (status === "429") {
      const cooldown = Math.min(5 * 60 * 1000 * Math.pow(2, rateLimitRetries), 30 * 60 * 1000);
      rateLimitRetries++;
      logger.warn(`Rate limited for @${monitor.username}, waiting ${cooldown / 60000} minutes (attempt ${rateLimitRetries})`);
      await sleep(cooldown);
      return pollMonitor(monitor, twitterService, telegramService, pollingIntervalMs);
    }
    // Reset on non-429 errors
    rateLimitRetries = 0;

    logger.error(`Poll failed for @${monitor.username}`, {
      error: err?.message || String(err),
    });
  }

  // Schedule next poll
  if (!isShuttingDown) {
    const timeout = setTimeout(() => {
      activeTimeouts.delete(timeout);
      pollMonitor(monitor, twitterService, telegramService, pollingIntervalMs);
    }, pollingIntervalMs);
    activeTimeouts.add(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shutdown(): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("Shutting down gracefully...");

  for (const timeout of activeTimeouts) {
    clearTimeout(timeout);
  }
  activeTimeouts.clear();

  stopPeriodicPersist();
  persistSeenTweets();

  logger.info("Shutdown complete");
  process.exit(0);
}

async function main(): Promise<void> {
  logger.info("Starting Twitter Real-Time Monitor");

  const config = loadConfig();

  const twitterService = new TwitterService(config.authToken, config.ct0);
  const telegramService = new TelegramService(config.botToken);

  loadSeenTweets();
  startPeriodicPersist();

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const enabledMonitors = config.monitors.filter((m) => m.enabled);

  if (enabledMonitors.length === 0) {
    logger.warn("No enabled monitors found");
    return;
  }

  logger.info(`Starting ${enabledMonitors.length} monitor(s)`);

  for (const monitor of enabledMonitors) {
    if (!monitor.telegramChatId) {
      logger.warn(`Skipping @${monitor.username}: no Telegram chat ID`);
      continue;
    }

    logger.info(`Monitoring @${monitor.username} -> chat ${monitor.telegramChatId}`);
    pollMonitor(monitor, twitterService, telegramService, config.pollingIntervalMs);
  }
}

main().catch((err) => {
  logger.error("Fatal error", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
