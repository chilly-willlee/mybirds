import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { getLifeList } from "@/lib/db/life-list";
import { checkRateLimit } from "@/lib/rate-limit";

const QuerySchema = z.object({
  sort: z.enum(["date-asc", "date-desc", "alpha-asc", "alpha-desc"]).default("date-desc"),
  search: z.string().optional(),
});

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

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  let species = await getLifeList(session.user.id);

  if (parsed.data.search) {
    const q = parsed.data.search.toLowerCase();
    species = species.filter(
      (s) =>
        s.commonName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q),
    );
  }

  const toTime = (d: string) => (d ? new Date(d).getTime() : 0);

  switch (parsed.data.sort) {
    case "date-asc":
      species.sort((a, b) => toTime(a.firstObservation.date) - toTime(b.firstObservation.date));
      break;
    case "date-desc":
      species.sort((a, b) => toTime(b.firstObservation.date) - toTime(a.firstObservation.date));
      break;
    case "alpha-asc":
      species.sort((a, b) => a.commonName.localeCompare(b.commonName));
      break;
    case "alpha-desc":
      species.sort((a, b) => b.commonName.localeCompare(a.commonName));
      break;
  }

  return NextResponse.json({
    species,
    totalCount: species.length,
  });
}
