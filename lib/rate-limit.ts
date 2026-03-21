const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // per window per IP

const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Clean up stale entries periodically (guard against HMR re-registration)
const globalKey = "__rate_limit_cleanup";
if (!(globalThis as Record<string, unknown>)[globalKey]) {
  (globalThis as Record<string, unknown>)[globalKey] = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now > entry.resetAt) hits.delete(ip);
    }
  }, 60 * 1000);
}
