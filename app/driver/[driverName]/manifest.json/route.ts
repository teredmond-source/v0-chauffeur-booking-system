import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ driverName: string }> }
) {
  const { driverName } = await params;

  const manifest = {
    name: `RCD Driver - ${decodeURIComponent(driverName).replace(/-/g, " ")}`,
    short_name: "RCD Driver",
    description: "Redmond Chauffeur Drive - Driver Dashboard",
    start_url: `/driver/${driverName}`,
    scope: `/driver/${driverName}`,
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#b8860b",
    icons: [
      {
        src: "/rcd-icon-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any"
      },
      {
        src: "/rcd-icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
