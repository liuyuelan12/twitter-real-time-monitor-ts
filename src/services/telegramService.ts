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
