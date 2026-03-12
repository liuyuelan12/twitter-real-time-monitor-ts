import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { TwitterService } from "../services/twitterService";
import { TelegramService } from "../services/telegramService";
import { TweetData } from "../types";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();
const POLL_INTERVAL = 60_000;
const RATE_LIMIT_COOLDOWN = 5 * 60 * 1000;

// Shared Twitter service using platform auth_token/ct0
const twitterService = new TwitterService(
  process.env.AUTH_TOKEN!,
  process.env.CT0!,
);

// Track seen tweets per user-monitor to avoid duplicates
const seenTweets = new Map<string, Set<string>>();
// Track first-run per monitor
const initializedMonitors = new Set<string>();

function getSeenSet(key: string): Set<string> {
  let set = seenTweets.get(key);
  if (!set) {
    set = new Set();
    seenTweets.set(key, set);
  }
  return set;
}

async function pollAllMonitors(): Promise<void> {
  const now = new Date();

  // Get all active users with their monitors
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { trialExpiresAt: { gt: now } },
        { subscriptionActive: true, subscriptionExpiresAt: { gt: now } },
      ],
    },
    include: {
      monitors: {
        where: { enabled: true },
      },
    },
  });

  for (const user of users) {
    const chatIds = user.chatId ? user.chatId.split(",").filter(Boolean) : [];
    if (!user.botToken || chatIds.length === 0 || user.monitors.length === 0) continue;

    const telegramService = new TelegramService(user.botToken);

    for (const monitor of user.monitors) {
      const monitorKey = `${user.id}:${monitor.twitterUsername}`;
      const seen = getSeenSet(monitorKey);

      try {
        const tweets = await twitterService.fetchLatestTweets(monitor.twitterUsername);

        // First run for this monitor: just record IDs
        if (!initializedMonitors.has(monitorKey)) {
          for (const tweet of tweets) {
            seen.add(tweet.id);
          }
          initializedMonitors.add(monitorKey);
          logger.info(`Initialized @${monitor.twitterUsername} for user ${user.email}: ${tweets.length} existing tweets`);
          continue;
        }

        // Collect new tweets
        const newTweets: TweetData[] = [];
        for (const tweet of tweets) {
          if (seen.has(tweet.id)) continue;
          seen.add(tweet.id);
          newTweets.push(tweet);
        }

        // Group threads: tweets with same conversationId where the user replies to themselves
        const threads = new Map<string, TweetData[]>();
        const standalone: TweetData[] = [];

        for (const tweet of newTweets) {
          const isThreadReply =
            tweet.conversationId &&
            tweet.inReplyToId &&
            !tweet.isRetweet &&
            tweet.username.toLowerCase() === monitor.twitterUsername.toLowerCase();

          if (isThreadReply) {
            const group = threads.get(tweet.conversationId!) ?? [];
            group.push(tweet);
            threads.set(tweet.conversationId!, group);
          } else if (
            tweet.conversationId &&
            tweet.conversationId === tweet.id &&
            !tweet.isRetweet
          ) {
            // This could be the first tweet in a thread - check if other new tweets reference it
            const group = threads.get(tweet.conversationId) ?? [];
            group.push(tweet);
            threads.set(tweet.conversationId, group);
          } else {
            standalone.push(tweet);
          }
        }

        // Send threads (only groups with 2+ tweets)
        for (const [convId, threadTweets] of threads) {
          if (threadTweets.length < 2) {
            // Not actually a thread, send as standalone
            standalone.push(...threadTweets);
            continue;
          }

          for (const chatId of chatIds) {
            try {
              await telegramService.sendThread(chatId, threadTweets);
              logger.info(`Forwarded thread (${threadTweets.length} tweets, conv ${convId}) (@${monitor.twitterUsername}) -> ${user.email} [${chatId}]`);
              await sleep(1500);
            } catch (err: any) {
              logger.error(`Failed to forward thread to ${chatId} for ${user.email}`, {
                error: err?.message || String(err),
              });
            }
          }
        }

        // Send standalone tweets
        for (const tweet of standalone) {
          for (const chatId of chatIds) {
            try {
              await telegramService.sendTweet(chatId, tweet);
              logger.info(`Forwarded tweet ${tweet.id} (@${monitor.twitterUsername}) -> ${user.email} [${chatId}]`);
              await sleep(1500);
            } catch (err: any) {
              logger.error(`Failed to forward tweet ${tweet.id} to ${chatId} for ${user.email}`, {
                error: err?.message || String(err),
              });
            }
          }
        }

        // Trim seen set to prevent memory growth
        if (seen.size > 5000) {
          const arr = Array.from(seen);
          const toRemove = arr.slice(0, arr.length - 5000);
          for (const id of toRemove) seen.delete(id);
        }
      } catch (err: any) {
        const is429 = err?.message?.includes("429");
        if (is429) {
          logger.warn(`Rate limited while fetching @${monitor.twitterUsername}, cooling down`);
          await sleep(RATE_LIMIT_COOLDOWN);
        } else {
          logger.error(`Error fetching @${monitor.twitterUsername} for ${user.email}`, {
            error: err?.message || String(err),
          });
        }
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  logger.info("Worker started");

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Worker shutting down");
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    logger.info("Worker shutting down");
    process.exit(0);
  });

  // Main loop
  while (true) {
    try {
      await pollAllMonitors();
    } catch (err: any) {
      logger.error("Poll cycle failed", {
        error: err?.message || String(err),
      });
    }

    await sleep(POLL_INTERVAL);
  }
}

main();
