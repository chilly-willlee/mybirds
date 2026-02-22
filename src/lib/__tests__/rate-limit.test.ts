import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows first request", () => {
    const { allowed, remaining } = checkRateLimit("test-ip-1");
    expect(allowed).toBe(true);
    expect(remaining).toBe(29);
  });

  it("allows up to 30 requests per minute", () => {
    const ip = "test-ip-2";
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true);
    }
    expect(checkRateLimit(ip).allowed).toBe(false);
    expect(checkRateLimit(ip).remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const ip = "test-ip-3";
    for (let i = 0; i < 30; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);
    const { allowed, remaining } = checkRateLimit(ip);
    expect(allowed).toBe(true);
    expect(remaining).toBe(29);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 30; i++) checkRateLimit("ip-a");
    expect(checkRateLimit("ip-a").allowed).toBe(false);
    expect(checkRateLimit("ip-b").allowed).toBe(true);
  });
});
