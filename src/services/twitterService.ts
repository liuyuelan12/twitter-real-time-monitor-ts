import { TweetData, TweetMedia } from "../types";
import { logger } from "../utils/logger";

const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const USER_BY_SCREEN_NAME_URL =
  "https://x.com/i/api/graphql/xmU6X_CKVnQ5lSrCbAmJsg/UserByScreenName";

const USER_TWEETS_URL =
  "https://x.com/i/api/graphql/Y9WM4Id6UcGFE8Z-hbnixw/UserTweets";

const FEATURES = {
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_enabled: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

export class TwitterService {
  private readonly authToken: string;
  private readonly ct0: string;
  private readonly userIdCache = new Map<string, string>();

  constructor(authToken: string, ct0: string) {
    this.authToken = authToken;
    this.ct0 = ct0;
  }

  private buildHeaders(): Record<string, string> {
    return {
      authorization: `Bearer ${decodeURIComponent(BEARER_TOKEN)}`,
      cookie: `auth_token=${this.authToken}; ct0=${this.ct0}`,
      "x-csrf-token": this.ct0,
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-active-user": "yes",
      "content-type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      referer: "https://x.com/",
    };
  }

  private async getUserId(username: string): Promise<string> {
    const cached = this.userIdCache.get(username);
    if (cached) return cached;

    const variables = JSON.stringify({
      screen_name: username,
      withSafetyModeUserFields: true,
    });
    const features = JSON.stringify(FEATURES);

    const url = `${USER_BY_SCREEN_NAME_URL}?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`;

    const res = await fetch(url, { headers: this.buildHeaders() });

    if (!res.ok) {
      throw new Error(`Failed to get user ID for @${username}: ${res.status} ${res.statusText}`);
    }

    const data: any = await res.json();
    const userId = data?.data?.user?.result?.rest_id;

    if (!userId) {
      throw new Error(`User ID not found for @${username}`);
    }

    this.userIdCache.set(username, userId);
    logger.info(`Resolved @${username} -> userId ${userId}`);
    return userId;
  }

  async fetchLatestTweets(username: string, count = 20): Promise<readonly TweetData[]> {
    const userId = await this.getUserId(username);

    const variables = JSON.stringify({
      userId,
      count,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
      withV2Timeline: true,
    });
    const features = JSON.stringify(FEATURES);

    const url = `${USER_TWEETS_URL}?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`;

    const res = await fetch(url, { headers: this.buildHeaders() });

    if (!res.ok) {
      throw new Error(`Failed to fetch tweets for @${username}: ${res.status} ${res.statusText}`);
    }

    const data: any = await res.json();
    const tweets = this.parseTimeline(data, username);

    logger.info(`Fetched ${tweets.length} tweets for @${username}`);
    return tweets;
  }

  private parseTimeline(data: any, fallbackUsername: string): TweetData[] {
    const tweets: TweetData[] = [];

    try {
      const instructions =
        data?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? [];

      for (const instruction of instructions) {
        if (instruction.type !== "TimelineAddEntries") continue;

        for (const entry of instruction.entries ?? []) {
          // Skip promoted/ad tweets
          if (entry?.content?.itemContent?.promotedMetadata) continue;

          const tweetResult =
            entry?.content?.itemContent?.tweet_results?.result;
          if (!tweetResult) continue;

          const parsed = this.parseTweetResult(tweetResult, fallbackUsername);
          if (!parsed) continue;

          // Only include tweets from the monitored user (original or retweet)
          const isFromUser = parsed.username.toLowerCase() === fallbackUsername.toLowerCase();
          const isRetweetByUser = parsed.isRetweet && parsed.retweetedUser;
          if (isFromUser || isRetweetByUser) {
            tweets.push(parsed);
          }
        }
      }
    } catch (err) {
      logger.error("Failed to parse timeline response", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return tweets;
  }

  private parseTweetResult(result: any, fallbackUsername: string): TweetData | null {
    try {
      // Handle tweet with tombstone or unavailable
      const tweetData = result.__typename === "TweetWithVisibilityResults"
        ? result.tweet
        : result;

      if (!tweetData?.legacy || !tweetData?.rest_id) return null;

      const legacy = tweetData.legacy;
      const user = tweetData.core?.user_results?.result?.legacy;
      const username = user?.screen_name ?? fallbackUsername;

      // Extract media
      const media: TweetMedia[] = [];
      for (const m of legacy.extended_entities?.media ?? []) {
        if (m.type === "photo") {
          media.push({ type: "photo", url: m.media_url_https });
        } else if (m.type === "video" || m.type === "animated_gif") {
          // Get highest bitrate video variant
          const variants = m.video_info?.variants ?? [];
          const mp4s = variants.filter((v: any) => v.content_type === "video/mp4");
          mp4s.sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
          const videoUrl = mp4s[0]?.url ?? m.media_url_https;
          media.push({
            type: m.type === "animated_gif" ? "gif" : "video",
            url: videoUrl,
          });
        }
      }

      // Check retweet
      const isRetweet = !!legacy.retweeted_status_result;
      const retweetedUser =
        legacy.retweeted_status_result?.result?.core?.user_results?.result?.legacy?.screen_name;

      // Check quoted tweet
      let quotedTweet: TweetData["quotedTweet"];
      if (tweetData.quoted_status_result?.result) {
        const q = tweetData.quoted_status_result.result;
        const qLegacy = q.legacy ?? q.tweet?.legacy;
        const qUser = (q.core ?? q.tweet?.core)?.user_results?.result?.legacy;
        if (qLegacy) {
          quotedTweet = {
            text: qLegacy.full_text ?? "",
            username: qUser?.screen_name ?? "unknown",
          };
        }
      }

      const fullText = legacy.full_text ?? "";

      const conversationId = legacy.conversation_id_str ?? undefined;
      const inReplyToId = legacy.in_reply_to_status_id_str ?? undefined;

      return {
        id: tweetData.rest_id,
        text: fullText,
        username,
        createdAt: new Date(legacy.created_at),
        media,
        isRetweet,
        retweetedUser,
        quotedTweet,
        tweetUrl: `https://twitter.com/${username}/status/${tweetData.rest_id}`,
        conversationId,
        inReplyToId,
      };
    } catch (err) {
      logger.error("Failed to parse tweet result", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }
}
