import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from ".";
import { users } from "./schema";

export async function getUserSettings(userId: string) {
  const db = getDb();
  const [user] = await db
    .select({
      lat: users.lat,
      lng: users.lng,
      radiusMiles: users.radiusMiles,
    })
    .from(users)
    .where(eq(users.id, userId));

  return {
    lat: user?.lat ?? null,
    lng: user?.lng ?? null,
    radiusMiles: user?.radiusMiles ?? 10,
  };
}

export async function updateUserLocation(
  userId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ lat, lng, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserRadius(
  userId: string,
  radiusMiles: number,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ radiusMiles, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
