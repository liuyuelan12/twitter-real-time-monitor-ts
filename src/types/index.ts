export interface MonitorConfig {
  readonly username: string;
  readonly telegramChatId: string;
  readonly enabled: boolean;
}

export interface MonitorsFile {
  readonly monitors: readonly MonitorConfig[];
  readonly pollingIntervalMs: number;
}

export interface AppConfig {
  readonly authToken: string;
  readonly ct0: string;
  readonly botToken: string;
  readonly defaultChatId: string;
  readonly monitors: readonly MonitorConfig[];
  readonly pollingIntervalMs: number;
}

export interface TweetMedia {
  readonly type: "photo" | "video" | "gif";
  readonly url: string;
}

export interface TweetData {
  readonly id: string;
  readonly text: string;
  readonly username: string;
  readonly createdAt: Date;
  readonly media: readonly TweetMedia[];
  readonly isRetweet: boolean;
  readonly retweetedUser?: string;
  readonly quotedTweet?: {
    readonly text: string;
    readonly username: string;
  };
  readonly tweetUrl: string;
  readonly conversationId?: string;
  readonly inReplyToId?: string;
}
