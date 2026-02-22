import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseLifeListCsv } from "@/lib/lifelist/csv-parser";
import { auth } from "@/lib/auth";
import { upsertLifeList, recordImport } from "@/lib/db/life-list";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field in form data" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 413 },
    );
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      { error: "File must be a CSV (.csv)" },
      { status: 400 },
    );
  }

  const text = await file.text();
  const result = parseLifeListCsv(text);

  await upsertLifeList(session.user.id, result.species);
  await recordImport(session.user.id, {
    speciesCount: result.species.length,
    totalObservations: result.totalObservations,
    skippedRows: result.skippedRows,
  });

  return NextResponse.json({
    speciesCount: result.species.length,
    totalObservations: result.totalObservations,
    skippedRows: result.skippedRows,
    species: result.species,
  }, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
