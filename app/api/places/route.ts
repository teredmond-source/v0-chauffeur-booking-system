import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input");

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&components=country:ie&types=geocode|establishment&language=en&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[v0] Places API error:", data.status, data.error_message);
      return NextResponse.json({ predictions: [] });
    }

    const predictions = (data.predictions || []).map(
      (p: { description: string; place_id: string }) => ({
        description: p.description,
        placeId: p.place_id,
      })
    );

    return NextResponse.json({ predictions });
  } catch (err) {
    console.error("[v0] Places API fetch error:", err);
    return NextResponse.json({ predictions: [] });
  }
}
