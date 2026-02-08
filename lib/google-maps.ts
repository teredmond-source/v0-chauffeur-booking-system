export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  originAddress: string;
  destinationAddress: string;
}

export async function calculateDistance(
  pickupEircode: string,
  destinationEircode: string
): Promise<DistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY");
  }

  // Prefix with "Ireland, " for accurate Eircode geocoding
  const origin = encodeURIComponent(`Ireland, ${pickupEircode}`);
  const destination = encodeURIComponent(`Ireland, ${destinationEircode}`);

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&units=metric&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    throw new Error(
      `Could not calculate distance: ${element?.status || "No results found"}. Please verify both Eircodes are valid.`
    );
  }

  return {
    distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
    durationMinutes: Math.round(element.duration.value / 60),
    originAddress: data.origin_addresses?.[0] || pickupEircode,
    destinationAddress: data.destination_addresses?.[0] || destinationEircode,
  };
}
