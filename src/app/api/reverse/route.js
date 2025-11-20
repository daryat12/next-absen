import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ ok: false, error: "Missing lat/lon" });
    }

    const apiKey = process.env.LOCATIONIQ_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing API key" });
    }

    const resp = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${encodeURIComponent(
        apiKey
      )}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
        lon
      )}&format=json`
    );

    const data = await resp.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("reverse route error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" });
  }
}
