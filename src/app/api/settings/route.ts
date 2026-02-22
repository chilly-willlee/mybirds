import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { getUserSettings, updateUserLocation, updateUserRadius } from "@/lib/db/user-settings";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const settings = await getUserSettings(session.user.id);
  return NextResponse.json(settings);
}

const PatchSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusMiles: z.number().min(1).max(25).optional(),
});

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { lat, lng, radiusMiles } = parsed.data;

  if (lat !== undefined && lng !== undefined) {
    await updateUserLocation(session.user.id, lat, lng);
  }

  if (radiusMiles !== undefined) {
    await updateUserRadius(session.user.id, radiusMiles);
  }

  const settings = await getUserSettings(session.user.id);
  return NextResponse.json(settings);
}
