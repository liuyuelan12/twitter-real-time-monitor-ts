import TelegramBot from "node-telegram-bot-api";
import { TweetData } from "../types";
import { logger } from "../utils/logger";

export class TelegramService {
  private readonly bot: TelegramBot;

  constructor(token: string) {
    this.bot = new TelegramBot(token);
  }

  async sendTweet(chatId: string, tweet: TweetData): Promise<void> {
    try {
      const message = this.formatTweetMessage(tweet);

      if (tweet.media.length === 0) {
        await this.sendTextMessage(chatId, message);
      } else if (tweet.media.length === 1) {
        await this.sendSingleMedia(chatId, tweet, message);
      } else {
        await this.sendMediaGroup(chatId, tweet, message);
      }

      logger.info(`Sent tweet ${tweet.id} to chat ${chatId}`);
    } catch (err) {
      logger.error(`Failed to send tweet ${tweet.id} to chat ${chatId}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private formatTweetMessage(tweet: TweetData): string {
    const parts: string[] = [];

    if (tweet.isRetweet && tweet.retweetedUser) {
      parts.push(`<b>RT @${escapeHtml(tweet.retweetedUser)}</b>`);
    }

    parts.push(`<b>@${escapeHtml(tweet.username)}</b>`);
    parts.push("");
    parts.push(escapeHtml(tweet.text));

    if (tweet.quotedTweet) {
      parts.push("");
      parts.push(`<blockquote>Quote from <b>@${escapeHtml(tweet.quotedTweet.username)}</b>\n${escapeHtml(tweet.quotedTweet.text)}</blockquote>`);
    }

    parts.push("");
    parts.push(`<a href="${tweet.tweetUrl}">View on Twitter</a>`);

    return parts.join("\n");
  }

  private async sendTextMessage(chatId: string, text: string): Promise<void> {
    await this.bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
  }

  private async sendSingleMedia(chatId: string, tweet: TweetData, caption: string): Promise<void> {
    const media = tweet.media[0];

    if (media.type === "photo") {
      await this.bot.sendPhoto(chatId, media.url, {
        caption,
        parse_mode: "HTML",
      });
    } else if (media.type === "video" || media.type === "gif") {
      await this.bot.sendVideo(chatId, media.url, {
        caption,
        parse_mode: "HTML",
      });
    }
  }

  async sendThread(chatId: string, tweets: readonly TweetData[]): Promise<void> {
    try {
      const sorted = [...tweets].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      const parts: string[] = [];
      parts.push(`<b>🧵 Thread by @${escapeHtml(sorted[0].username)}</b>`);
      parts.push("");

      const allMedia: TweetData["media"][number][] = [];

      for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];
        parts.push(`<b>[${i + 1}/${sorted.length}]</b>`);
        parts.push(escapeHtml(t.text));

        if (t.quotedTweet) {
          parts.push(
            `<blockquote>Quote from <b>@${escapeHtml(t.quotedTweet.username)}</b>\n${escapeHtml(t.quotedTweet.text)}</blockquote>`,
          );
        }

        parts.push("");
        allMedia.push(...t.media);
      }

      parts.push(
        `<a href="${sorted[0].tweetUrl}">View thread on Twitter</a>`,
      );

      const message = parts.join("\n");

      if (allMedia.length === 0) {
        await this.sendTextMessage(chatId, message);
      } else if (allMedia.length === 1) {
        const m = allMedia[0];
        if (m.type === "photo") {
          await this.bot.sendPhoto(chatId, m.url, {
            caption: message,
            parse_mode: "HTML",
          });
        } else {
          await this.bot.sendVideo(chatId, m.url, {
            caption: message,
            parse_mode: "HTML",
          });
        }
      } else {
        const mediaGroup: TelegramBot.InputMedia[] = allMedia.map((m, i) => {
          const base: any = {
            type: m.type === "photo" ? "photo" : "video",
            media: m.url,
          };
          if (i === 0) {
            base.caption = message;
            base.parse_mode = "HTML";
          }
          return base;
        });
        await this.bot.sendMediaGroup(chatId, mediaGroup);
      }

      logger.info(
        `Sent thread (${sorted.length} tweets) to chat ${chatId}`,
      );
    } catch (err) {
      logger.error(`Failed to send thread to chat ${chatId}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private async sendMediaGroup(chatId: string, tweet: TweetData, caption: string): Promise<void> {
    const mediaGroup: TelegramBot.InputMedia[] = tweet.media.map((m, i) => {
      const base: any = {
        type: m.type === "photo" ? "photo" : "video",
        media: m.url,
      };

      // Only the first item carries the caption
      if (i === 0) {
        base.caption = caption;
        base.parse_mode = "HTML";
      }

      return base;
    });

    await this.bot.sendMediaGroup(chatId, mediaGroup);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
