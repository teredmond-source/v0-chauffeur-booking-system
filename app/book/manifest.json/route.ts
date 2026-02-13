import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "RCD - Book a Chauffeur",
    short_name: "RCD Book",
    description: "Redmond Chauffeur Drive - Executive Travel Booking",
    start_url: "/book",
    scope: "/book",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#b8860b",
    icons: [
      {
        src: "/rcd-icon-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/rcd-icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
