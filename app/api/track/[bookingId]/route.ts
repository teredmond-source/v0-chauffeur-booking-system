import { NextResponse } from "next/server";
import { getBookings } from "@/lib/google-sheets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const bookings = await getBookings();
    const booking = bookings.find((b) => b["Request ID"] === bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const journeyStatus = booking["Journey Status"] || "idle";

    // Privacy: if journey is completed or idle, don't share location
    if (journeyStatus === "completed" || journeyStatus === "idle") {
      return NextResponse.json({
        bookingId,
        journeyStatus,
        driverName: booking["Driver Name"] || "",
        vehicleType: booking["Vehicle Type"] || "",
        vehicleReg: booking["Vehicle Reg"] || "",
        pickupAddress: booking["Origin Address"] || booking["Pickup Eircode"] || "",
        destAddress: booking["Destination Address"] || booking["Destination Eircode"] || "",
        pickupTimestamp: booking["Pickup Timestamp"] || null,
        completionTimestamp: booking["Completion Timestamp"] || null,
        lat: null,
        lng: null,
      });
    }

    // Active journey - share location
    return NextResponse.json({
      bookingId,
      journeyStatus,
      driverName: booking["Driver Name"] || "",
      vehicleType: booking["Vehicle Type"] || "",
      vehicleReg: booking["Vehicle Reg"] || "",
      pickupAddress: booking["Origin Address"] || booking["Pickup Eircode"] || "",
      destAddress: booking["Destination Address"] || booking["Destination Eircode"] || "",
      pickupTimestamp: booking["Pickup Timestamp"] || null,
      completionTimestamp: booking["Completion Timestamp"] || null,
      lat: booking["Driver Lat"] || null,
      lng: booking["Driver Lng"] || null,
      date: booking["Date"] || "",
      time: booking["Time"] || "",
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
