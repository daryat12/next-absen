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
    const apiKeyBackup = process.env.LOCATIONIQ_KEY_BACKUP;
  
    if (!apiKey && !apiKeyBackup) {
      return NextResponse.json({ ok: false, error: "Missing API key" });
    }
  
    // --- FETCH UTAMA ---
    const fetchData = async (keyToUse) => {
      const resp = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=${encodeURIComponent(
          keyToUse
        )}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
          lon
        )}&format=json`
      );
      return resp.json();
    };
  
    // Coba pakai key utama
    let data = await fetchData(apiKey);
  
    // Jika gagal (display_name tidak ada), coba key backup
    if ((!data || !data.display_name) && apiKeyBackup) {
      data = await fetchData(apiKeyBackup);
    }
  
    // Jika tetap tidak ada display_name → error
    if (!data || !data.display_name) {
      return NextResponse.json({ ok: false, error: "Failed to get location" });
    }
  
    return NextResponse.json({ ok: true, data });
  
  } catch (err) {
    console.error("reverse route error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" });
  }  
}
