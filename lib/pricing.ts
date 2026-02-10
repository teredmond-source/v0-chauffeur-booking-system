export type RateType = "standard" | "premium" | "special";

export interface FareBreakdown {
  initialCharge: number;
  tariffA: number;
  tariffB: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes: number;
  rateType: RateType;
  rateName: string;
}

// NTA Maximum Taxi Fare Rates
const RATES = {
  standard: {
    name: "Standard Rate",
    initialCharge: 4.40,
    tariffAPerKm: 1.32,
    tariffAPerMin: 0.47,
    tariffBPerKm: 1.72,
    tariffBPerMin: 0.61,
    tariffAMaxTotal: 23.60, // Max total fare at end of Tariff A
  },
  premium: {
    name: "Premium Rate",
    initialCharge: 5.40,
    tariffAPerKm: 1.81,
    tariffAPerMin: 0.64,
    tariffBPerKm: 2.20,
    tariffBPerMin: 0.78,
    tariffAMaxTotal: 31.80,
  },
  special: {
    name: "Special Rate",
    initialCharge: 5.40,
    tariffAPerKm: 0, // No Tariff A - goes straight to Tariff B
    tariffAPerMin: 0,
    tariffBPerKm: 2.20,
    tariffBPerMin: 0.78,
    tariffAMaxTotal: 0,
  },
};

const TARIFF_A_THRESHOLD_KM = 15; // Next 15km after initial
const INITIAL_DISTANCE_KM = 0.5; // 500m included in initial charge

// Irish public holidays (month/day) - fixed dates
const PUBLIC_HOLIDAYS_FIXED = [
  [1, 1],   // New Year's Day
  [2, 3],   // St. Brigid's Day (first Mon in Feb - simplified)
  [3, 17],  // St. Patrick's Day
  [5, 5],   // May Bank Holiday (first Mon - simplified)
  [6, 2],   // June Bank Holiday (first Mon - simplified)
  [8, 4],   // August Bank Holiday (first Mon - simplified)
  [10, 27], // October Bank Holiday (last Mon - simplified)
  [12, 25], // Christmas Day
  [12, 26], // St. Stephen's Day
];

/**
 * Determine the NTA rate type based on pickup date and time.
 * - Standard: 8am-8pm Mon-Sat (excl public holidays)
 * - Premium: 8pm-8am Mon-Sat, all day Sun, most public holidays
 * - Special: 00:00-04:00 Sat/Sun, Christmas Eve 20:00 to St Stephen's 08:00,
 *            New Year's Eve 20:00 to New Year's Day 08:00
 */
export function determineRateType(pickupDate?: string, pickupTime?: string): RateType {
  if (!pickupDate || !pickupTime) return "standard"; // Default if unknown

  let date: Date;
  try {
    // Handle DD/MM/YYYY format
    const parts = pickupDate.split("/");
    if (parts.length === 3) {
      date = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T${pickupTime}:00`);
    } else {
      date = new Date(`${pickupDate}T${pickupTime}:00`);
    }
    if (Number.isNaN(date.getTime())) return "standard";
  } catch {
    return "standard";
  }

  const hour = date.getHours();
  const day = date.getDay(); // 0=Sun, 6=Sat
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();

  // Check Special Rate first (most restrictive)
  // Sat/Sun 00:00-04:00
  if ((day === 0 || day === 6) && hour >= 0 && hour < 4) {
    return "special";
  }
  // Christmas Eve (Dec 24) 20:00 onwards
  if (month === 12 && dayOfMonth === 24 && hour >= 20) return "special";
  // Christmas Day (Dec 25) all day
  if (month === 12 && dayOfMonth === 25) return "special";
  // St Stephen's Day (Dec 26) before 08:00
  if (month === 12 && dayOfMonth === 26 && hour < 8) return "special";
  // New Year's Eve (Dec 31) 20:00 onwards
  if (month === 12 && dayOfMonth === 31 && hour >= 20) return "special";
  // New Year's Day (Jan 1) before 08:00
  if (month === 1 && dayOfMonth === 1 && hour < 8) return "special";

  // Check Premium Rate
  // All day Sunday
  if (day === 0) return "premium";
  // Mon-Sat 8pm to 8am (night hours)
  if (hour >= 20 || hour < 8) return "premium";
  // Public holidays (daytime)
  const isPublicHoliday = PUBLIC_HOLIDAYS_FIXED.some(([m, d]) => m === month && d === dayOfMonth);
  if (isPublicHoliday) return "premium";

  // Standard Rate: 8am-8pm Mon-Sat
  return "standard";
}

export function calculateNTAFare(
  distanceKm: number,
  durationMinutes: number,
  pickupDate?: string,
  pickupTime?: string,
): FareBreakdown {
  const rateType = determineRateType(pickupDate, pickupTime);
  const rate = RATES[rateType];

  let tariffA = 0;
  let tariffB = 0;

  if (rateType === "special") {
    // Special rate: Tariff B applies immediately after initial charge
    const chargeableDistance = Math.max(0, distanceKm - INITIAL_DISTANCE_KM);
    tariffB = chargeableDistance * rate.tariffBPerKm;
  } else if (distanceKm <= TARIFF_A_THRESHOLD_KM + INITIAL_DISTANCE_KM) {
    // All distance within Tariff A
    const chargeableDistance = Math.max(0, distanceKm - INITIAL_DISTANCE_KM);
    tariffA = chargeableDistance * rate.tariffAPerKm;
  } else {
    // Distance spans both tariffs
    const tariffADistance = TARIFF_A_THRESHOLD_KM;
    tariffA = tariffADistance * rate.tariffAPerKm;
    tariffB = (distanceKm - TARIFF_A_THRESHOLD_KM - INITIAL_DISTANCE_KM) * rate.tariffBPerKm;
  }

  const totalFare = rate.initialCharge + tariffA + tariffB;

  return {
    initialCharge: rate.initialCharge,
    tariffA: Math.round(tariffA * 100) / 100,
    tariffB: Math.round(tariffB * 100) / 100,
    totalFare: Math.round(totalFare * 100) / 100,
    distanceKm,
    durationMinutes,
    rateType,
    rateName: rate.name,
  };
}
