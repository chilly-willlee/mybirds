import "server-only";
import { EBirdClient } from "./client";
import { InMemoryCache } from "./cache";

function getApiKey(): string {
  const key = process.env.EBIRD_API_KEY;
  if (!key) throw new Error("EBIRD_API_KEY environment variable is required");
  return key;
}

let clientInstance: EBirdClient | null = null;

export function getEBirdClient(): EBirdClient {
  if (!clientInstance) {
    clientInstance = new EBirdClient({ apiKey: getApiKey() });
  }
  return clientInstance;
}

let cacheInstance: InMemoryCache | null = null;

export function getCache(): InMemoryCache {
  if (!cacheInstance) {
    cacheInstance = new InMemoryCache();
  }
  return cacheInstance;
}
