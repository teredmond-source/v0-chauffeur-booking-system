export interface FareBreakdown {
  initialCharge: number;
  preBookingFee: number;
  tariffA: number;
  tariffB: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes: number;
}

// NTA 2026 Maximum Fare Calculation - Standard Daytime
const INITIAL_CHARGE = 4.4; // Includes first 500m
const PRE_BOOKING_FEE = 3.0;
const TARIFF_A_PER_KM = 1.32; // Up to 15km
const TARIFF_B_PER_KM = 1.72; // Over 15km
const TARIFF_A_THRESHOLD = 15; // km
const INITIAL_DISTANCE_INCLUDED = 0.5; // km included in initial charge

export function calculateNTAFare(
  distanceKm: number,
  durationMinutes: number
): FareBreakdown {
  let tariffA = 0;
  let tariffB = 0;

  if (distanceKm <= TARIFF_A_THRESHOLD) {
    // All distance within Tariff A
    const chargeableDistance = Math.max(
      0,
      distanceKm - INITIAL_DISTANCE_INCLUDED
    );
    tariffA = chargeableDistance * TARIFF_A_PER_KM;
  } else {
    // Distance spans both tariffs
    const tariffADistance = TARIFF_A_THRESHOLD - INITIAL_DISTANCE_INCLUDED;
    tariffA = tariffADistance * TARIFF_A_PER_KM;
    tariffB = (distanceKm - TARIFF_A_THRESHOLD) * TARIFF_B_PER_KM;
  }

  const totalFare = INITIAL_CHARGE + PRE_BOOKING_FEE + tariffA + tariffB;

  return {
    initialCharge: INITIAL_CHARGE,
    preBookingFee: PRE_BOOKING_FEE,
    tariffA: Math.round(tariffA * 100) / 100,
    tariffB: Math.round(tariffB * 100) / 100,
    totalFare: Math.round(totalFare * 100) / 100,
    distanceKm,
    durationMinutes,
  };
}
