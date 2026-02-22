import { NextRequest, NextResponse } from "next/server";

interface GeocodeResult {
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, GeocodeResult>();

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip")?.trim();
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Valid 5-digit ZIP code required" }, { status: 400 });
  }

  const cached = geocodeCache.get(zip);
  if (cached) return NextResponse.json(cached);

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&countrycodes=us&format=json&limit=1`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "NewBirds/1.0 (https://github.com/new-birds)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) throw new Error("Geocode request failed");

    const data = await resp.json();
    if (!data.length) {
      return NextResponse.json({ error: "ZIP code not found" }, { status: 404 });
    }

    const result: GeocodeResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    geocodeCache.set(zip, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
