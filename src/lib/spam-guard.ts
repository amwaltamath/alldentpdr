/**
 * Lightweight, dependency-free spam heuristics for public lead/chat endpoints.
 *
 * Rate limiting uses an in-memory map, which is best-effort on serverless
 * platforms (state resets per cold start / instance) but still blocks the
 * common case of a single bot hammering an endpoint from one warm instance.
 */

const hitLog = new Map<string, number[]>();

/** Returns true if `key` has exceeded `max` hits within `windowMs`. Records this hit either way. */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (hitLog.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  hitLog.set(key, hits);

  // Occasionally prune stale keys so the map doesn't grow unbounded.
  if (hitLog.size > 5000) {
    for (const [k, timestamps] of hitLog) {
      if (!timestamps.some((t) => now - t < windowMs)) hitLog.delete(k);
    }
  }

  return hits.length > max;
}

const URL_PATTERN = /https?:\/\/\S+/gi;

/** Heuristic content check for obvious spam patterns (link-stuffing, BBCode, gibberish). */
export function looksLikeSpamContent(text: string | undefined | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  const urlMatches = trimmed.match(URL_PATTERN);
  if (urlMatches && urlMatches.length >= 2) return true;

  if (/\[url=|\[link=|<a\s+href/i.test(trimmed)) return true;

  // Mostly non-letter characters in a longer message (common in obfuscated spam).
  if (trimmed.length > 40) {
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    if (letters.length / trimmed.length < 0.4) return true;
  }

  return false;
}

/** True if a hidden honeypot field was filled in — real visitors never see or fill it. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True if the form was submitted implausibly fast after it was rendered (bot behavior). */
export function submittedTooFast(renderedAt: unknown, minMs = 1500): boolean {
  const ts = Number(renderedAt);
  if (!ts || Number.isNaN(ts)) return false; // missing timestamp: don't penalize (progressive enhancement)
  return Date.now() - ts < minMs;
}
