import "server-only";
import { z } from "zod/v4";

const EBIRD_BASE_URL = "https://api.ebird.org/v2";

export class EBirdApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly path: string,
  ) {
    super(`eBird API error ${status} (${statusText}) for ${path}`);
    this.name = "EBirdApiError";
  }
}

export interface EBirdClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export class EBirdClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(config: EBirdClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? EBIRD_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.retries = config.retries ?? 2;
    this.retryDelayMs = config.retryDelayMs ?? 1_000;
  }

  async get<T>(
    path: string,
    params: Record<string, string | number | boolean>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      if (attempt > 0) {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          headers: { "x-ebirdapitoken": this.apiKey },
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = new EBirdApiError(
            response.status,
            response.statusText,
            path,
          );
          if (response.status >= 500) {
            lastError = error;
            continue;
          }
          throw error;
        }

        const data = await response.json();
        return schema.parse(data);
      } catch (err) {
        if (err instanceof EBirdApiError && err.status < 500) throw err;

        if (err instanceof DOMException && err.name === "AbortError") {
          lastError = new Error(`eBird API timeout after ${this.timeoutMs}ms for ${path}`);
          continue;
        }

        if (err instanceof z.ZodError) throw err;

        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < this.retries) continue;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new Error(`eBird API request failed for ${path}`);
  }

  private buildUrl(
    path: string,
    params: Record<string, string | number | boolean>,
  ): string {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${cleanPath}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
