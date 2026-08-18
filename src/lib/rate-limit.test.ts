import { describe, expect, it } from "vitest";
import { clearAttempts, consumeAttempt } from "./rate-limit";

describe("rate limiter", () => {
  it("bloque après la limite et peut être réinitialisé", () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(consumeAttempt(key, 2, 60_000).allowed).toBe(true);
    expect(consumeAttempt(key, 2, 60_000).allowed).toBe(true);
    expect(consumeAttempt(key, 2, 60_000).allowed).toBe(false);

    clearAttempts(key);
    expect(consumeAttempt(key, 2, 60_000).allowed).toBe(true);
  });
});
