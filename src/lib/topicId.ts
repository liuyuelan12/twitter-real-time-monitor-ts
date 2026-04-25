// Accepts:
//   - undefined / null / "" → null (clears the topic)
//   - positive integer
//   - t.me link: https://t.me/c/<chatId>/<topicId>[/<msgId>]
//                https://t.me/<groupname>/<topicId>[/<msgId>]
// Returns: number | null when valid, or "invalid" sentinel otherwise.
export function parseTopicId(input: unknown): number | null | "invalid" {
  if (input === undefined || input === null || input === "") return null;

  if (typeof input === "number") {
    return Number.isInteger(input) && input > 0 ? input : "invalid";
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const linkMatch = trimmed.match(/t\.me\/(?:c\/\d+|[A-Za-z0-9_]+)\/(\d+)/);
    if (linkMatch) {
      const n = parseInt(linkMatch[1], 10);
      return n > 0 ? n : "invalid";
    }

    if (/^\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10);
      return n > 0 ? n : "invalid";
    }

    return "invalid";
  }

  return "invalid";
}
