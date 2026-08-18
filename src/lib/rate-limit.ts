type Entry = { attempts: number; resetAt: number };
const attempts = new Map<string, Entry>();

export function consumeAttempt(key: string, limit = 6, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  if (attempts.size > 1000) for (const [entryKey, entry] of attempts) if (entry.resetAt <= now) attempts.delete(entryKey);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.attempts >= limit) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.attempts += 1;
  return { allowed: true, retryAfter: 0 };
}

export function clearAttempts(key: string) { attempts.delete(key); }
