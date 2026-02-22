import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "postgresql://build:build@localhost/build";
  return url;
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const sql = neon(getDatabaseUrl());
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}
