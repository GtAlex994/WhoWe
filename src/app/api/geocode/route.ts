import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "WhoWe-App/0.1 (prototype, local dev)",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = (await res.json()) as NominatimResult[];

  return NextResponse.json({
    results: data.map((r) => ({
      id: r.place_id,
      name: r.display_name,
      lat: r.lat,
      lon: r.lon,
    })),
  });
}
