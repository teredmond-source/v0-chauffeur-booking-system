import { NextResponse } from "next/server";
import { calculateDistance } from "@/lib/google-maps";
import { calculateNTAFare } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupEircode, destinationEircode } = body;

    if (!pickupEircode || !destinationEircode) {
      return NextResponse.json(
        { error: "Both Pickup Eircode and Destination Eircode are required." },
        { status: 400 }
      );
    }

    const distance = await calculateDistance(pickupEircode, destinationEircode);
    const fare = calculateNTAFare(distance.distanceKm, distance.durationMinutes);

    return NextResponse.json({
      distance: {
        km: distance.distanceKm,
        minutes: distance.durationMinutes,
        originAddress: distance.originAddress,
        destinationAddress: distance.destinationAddress,
      },
      fare,
    });
  } catch (error) {
    console.error("Quote API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
