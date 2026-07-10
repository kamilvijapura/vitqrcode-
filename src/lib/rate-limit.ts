const limits = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, limit = 5, windowMs = 60000): { ok: boolean } {
  const now = Date.now();
  const record = limits.get(key);

  if (record) {
    if (now > record.expiresAt) {
      // Expired, reset
      limits.set(key, { count: 1, expiresAt: now + windowMs });
      return { ok: true };
    }
    if (record.count >= limit) {
      return { ok: false };
    }
    // Increment count
    record.count++;
    return { ok: true };
  }

  limits.set(key, { count: 1, expiresAt: now + windowMs });
  return { ok: true };
}
