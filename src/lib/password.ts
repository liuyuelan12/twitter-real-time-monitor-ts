import { createHash, randomBytes, timingSafeEqual } from "crypto";

function hashWithSalt(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = hashWithSalt(password, salt);
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = hashWithSalt(password, salt);
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
  } catch {
    return false;
  }
}
