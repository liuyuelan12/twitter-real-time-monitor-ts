import TelegramBot from "node-telegram-bot-api";
import { TweetData } from "../types";
import { logger } from "../utils/logger";

export class TelegramService {
  private readonly bot: TelegramBot;

  constructor(token: string) {
    this.bot = new TelegramBot(token);
  }

  async sendTweet(
    chatId: string,
    tweet: TweetData,
    messageThreadId?: number | null,
  ): Promise<void> {
    try {
      const message = this.formatTweetMessage(tweet);

      if (tweet.media.length === 0) {
        await this.sendTextMessage(chatId, message, messageThreadId);
      } else if (tweet.media.length === 1) {
        await this.sendSingleMedia(chatId, tweet, message, messageThreadId);
      } else {
        await this.sendMediaGroup(chatId, tweet, message, messageThreadId);
      }

      logger.info(`Sent tweet ${tweet.id} to chat ${chatId}${messageThreadId ? `:topic ${messageThreadId}` : ""}`);
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
      parts.push(`<b>RT ${xLink(tweet.retweetedUser)}</b>`);
    }

    parts.push(`<b>${xLink(tweet.username)}</b>`);
    parts.push("");
    parts.push(linkifyMentions(escapeHtml(tweet.text)));

    if (tweet.quotedTweet) {
      parts.push("");
      parts.push(
        `<blockquote>Quote from <b>${xLink(tweet.quotedTweet.username)}</b>\n${linkifyMentions(escapeHtml(tweet.quotedTweet.text))}</blockquote>`,
      );
    }

    parts.push("");
    parts.push(`<a href="${tweet.tweetUrl}">View on Twitter</a>`);

    return parts.join("\n");
  }

  private async sendTextMessage(
    chatId: string,
    text: string,
    messageThreadId?: number | null,
  ): Promise<void> {
    await this.bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: false,
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
  }

  private async sendSingleMedia(
    chatId: string,
    tweet: TweetData,
    caption: string,
    messageThreadId?: number | null,
  ): Promise<void> {
    const media = tweet.media[0];
    const opts = messageThreadId ? { message_thread_id: messageThreadId } : {};

    if (media.type === "photo") {
      await this.bot.sendPhoto(chatId, media.url, {
        caption,
        parse_mode: "HTML",
        ...opts,
      });
    } else if (media.type === "video" || media.type === "gif") {
      await this.bot.sendVideo(chatId, media.url, {
        caption,
        parse_mode: "HTML",
        ...opts,
      });
    }
  }

  async sendThread(
    chatId: string,
    tweets: readonly TweetData[],
    messageThreadId?: number | null,
  ): Promise<void> {
    try {
      const sorted = [...tweets].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      const parts: string[] = [];
      parts.push(`<b>🧵 Thread by ${xLink(sorted[0].username)}</b>`);
      parts.push("");

      const allMedia: TweetData["media"][number][] = [];

      for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];
        parts.push(`<b>[${i + 1}/${sorted.length}]</b>`);
        parts.push(linkifyMentions(escapeHtml(t.text)));

        if (t.quotedTweet) {
          parts.push(
            `<blockquote>Quote from <b>${xLink(t.quotedTweet.username)}</b>\n${linkifyMentions(escapeHtml(t.quotedTweet.text))}</blockquote>`,
          );
        }

        parts.push("");
        allMedia.push(...t.media);
      }

      parts.push(
        `<a href="${sorted[0].tweetUrl}">View thread on Twitter</a>`,
      );

      const message = parts.join("\n");
      const opts = messageThreadId ? { message_thread_id: messageThreadId } : {};

      if (allMedia.length === 0) {
        await this.sendTextMessage(chatId, message, messageThreadId);
      } else if (allMedia.length === 1) {
        const m = allMedia[0];
        if (m.type === "photo") {
          await this.bot.sendPhoto(chatId, m.url, {
            caption: message,
            parse_mode: "HTML",
            ...opts,
          });
        } else {
          await this.bot.sendVideo(chatId, m.url, {
            caption: message,
            parse_mode: "HTML",
            ...opts,
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
        await this.bot.sendMediaGroup(chatId, mediaGroup, opts as any);
      }

      logger.info(
        `Sent thread (${sorted.length} tweets) to chat ${chatId}${messageThreadId ? `:topic ${messageThreadId}` : ""}`,
      );
    } catch (err) {
      logger.error(`Failed to send thread to chat ${chatId}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private async sendMediaGroup(
    chatId: string,
    tweet: TweetData,
    caption: string,
    messageThreadId?: number | null,
  ): Promise<void> {
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

    const opts = messageThreadId ? { message_thread_id: messageThreadId } : {};
    await this.bot.sendMediaGroup(chatId, mediaGroup, opts as any);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Build a plain X profile URL for a username (no @ prefix, avoids Telegram mention collision).
function xLink(username: string): string {
  const clean = username.replace(/^@/, "");
  return `https://x.com/${escapeHtml(clean)}`;
}

// Replace @username mentions inside escaped tweet text with full x.com URLs,
// so Telegram does not interpret them as Telegram user mentions.
function linkifyMentions(escapedText: string): string {
  return escapedText.replace(/@([A-Za-z0-9_]{1,15})/g, "https://x.com/$1");
}
