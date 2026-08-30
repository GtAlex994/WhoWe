import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(`geocode-reverse:${getClientIp(request)}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ label: null }, { status: 429 });
  }

  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ label: null }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("zoom", "10");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "WhoWe-App/0.1 (prototype, local dev)",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ label: null }, { status: 502 });
  }

  const data = (await res.json()) as { address?: Record<string, string> };
  const address = data.address ?? {};
  const city = address.city ?? address.town ?? address.village ?? address.suburb;
  const region = address.state ?? address.county;
  const label = [city, region].filter(Boolean).join(", ") || null;

  return NextResponse.json({ label });
}
