/**
 * Step Calculation Logic
 * Formula: 
 *   Step Length = 0.415 × (height in cm) / 100
 *   Steps = distance (meters) / step length
 *   Calories = steps × weight × height-based factor
 */

export interface UserMetrics {
  height: number; // in cm
  weight: number; // in kg
  gender: 'male' | 'female' | 'other';
}

/**
 * Calculate step length based on height
 * Step Length = 0.415 × height (in cm) / 100
 * @param heightCm - Height in centimeters
 * @returns Step length in meters
 */
export function calculateStepLength(heightCm: number): number {
  return (0.415 * heightCm) / 100;
}

/**
 * Calculate height-based calorie factor
 * Taller people burn more calories per step
 * @param heightCm - Height in centimeters
 * @returns Calorie factor (calories per step per kg)
 */
export function getHeightBasedCalorieFactor(heightCm: number): number {
  // Factor increases with height: roughly 0.00004-0.00005 per step per kg per cm
  // Normalize around 170cm (average adult height)
  return 0.00004 + (heightCm - 170) * 0.000001;
}

/**
 * Calculate steps from distance
 * @param distanceKm - Distance in kilometers
 * @param userMetrics - User height, weight, gender
 * @returns Estimated number of steps
 */
export function calculateStepsFromDistance(
  distanceKm: number,
  userMetrics: UserMetrics
): number {
  const distanceMeters = distanceKm * 1000;
  const stepLength = calculateStepLength(userMetrics.height);
  
  if (stepLength <= 0) return 0;
  
  return Math.round(distanceMeters / stepLength);
}

/**
 * Calculate distance from steps
 * @param steps - Number of steps taken
 * @param userMetrics - User height, weight, gender
 * @returns Distance in kilometers
 */
export function calculateDistanceFromSteps(
  steps: number,
  userMetrics: UserMetrics
): number {
  const stepLength = calculateStepLength(userMetrics.height);
  
  if (stepLength <= 0 || steps <= 0) return 0;
  
  const distanceMeters = steps * stepLength;
  return parseFloat((distanceMeters / 1000).toFixed(2));
}

/**
 * Estimate calories burned from steps and weight
 * Formula: Calories = steps × base_rate × (weight / 70) × height_adjustment
 * Standard: ~0.05 calories per step for 70kg person at average height
 * @param steps - Number of steps
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns Estimated calories burned
 */
export function estimateCaloriesBurned(
  steps: number,
  weightKg: number,
  heightCm: number
): number {
  // Standard: average person (70kg) burns ~0.05 cal per step when walking
  const baseCaloriesPerStep = 0.05;
  
  // Adjust for actual weight (heavier person burns more)
  const weightAdjustment = weightKg / 70;
  
  // Slight adjustment for height (taller person has longer stride = more work)
  const heightAdjustment = 1 + (heightCm - 170) * 0.001;
  
  return Math.round(steps * baseCaloriesPerStep * weightAdjustment * heightAdjustment);
}

/**
 * Calculate calories burned using METs (more accurate when height/steps/distance are available)
 * Core equation: Calories = Duration(min) x (MET x 3.5 x Weight(kg)) / 200
 *
 * @param params.weightKg - weight in kilograms (required)
 * @param params.heightCm - height in centimeters (optional, used to derive stride length)
 * @param params.steps - total steps taken (optional)
 * @param params.distanceKm - distance in kilometers (optional)
 * @param params.gender - 'male'|'female'|'other' (used for stride constants)
 * @param params.speedKmh - walking speed in km/h (optional)
 * @param params.met - override MET value directly (optional)
 */
export function calculateCaloriesMET(params: {
  weightKg: number;
  heightCm?: number;
  steps?: number;
  distanceKm?: number;
  gender?: 'male' | 'female' | 'other';
  speedKmh?: number;
  met?: number;
}): { calories: number; distanceKm?: number; durationMinutes?: number; met: number } {
  const { weightKg, heightCm, steps, distanceKm: providedDistanceKm, gender = 'other', speedKmh, met } = params;

  if (!weightKg || weightKg <= 0) return { calories: 0, met: met || 0 };

  let distanceKm = providedDistanceKm;

  // If distance not provided but steps and height are available, derive distance from stride length
  if ((distanceKm == null || isNaN(distanceKm)) && steps && heightCm) {
    const heightM = heightCm / 100;
    const stride = gender === 'male' ? heightM * 0.415 : gender === 'female' ? heightM * 0.413 : heightM * 0.414;
    const distanceMeters = stride * steps;
    distanceKm = distanceMeters / 1000;
  }

  // Determine MET
  let usedMet = met || 0;
  if (!usedMet) {
    if (speedKmh && speedKmh > 0) {
      // Map speed to MET buckets (approximate)
      if (speedKmh < 3.2) usedMet = 2.8; // <2 mph
      else if (speedKmh < 4.8) usedMet = 3.5; // ~3 mph
      else usedMet = 5.0; // brisk ~4 mph+
    } else {
      // If no speed provided, default to moderate walking MET
      usedMet = 3.5;
    }
  }

  // Determine duration (minutes). If speed is known and distance known, compute time.
  let durationMinutes: number | undefined;
  if (distanceKm != null && speedKmh && speedKmh > 0) {
    durationMinutes = (distanceKm / speedKmh) * 60;
  } else if (distanceKm != null && (!speedKmh || speedKmh <= 0)) {
    // Assume average walking speed 4.8 km/h (3 mph) if speed unknown
    const assumedSpeed = 4.8;
    durationMinutes = (distanceKm / assumedSpeed) * 60;
  } else {
    // No distance available; fall back to steps-only heuristic
    durationMinutes = undefined;
  }

  let calories = 0;

  if (durationMinutes && durationMinutes > 0) {
    calories = Math.round((durationMinutes * (usedMet * 3.5 * weightKg)) / 200);
  } else if (steps && heightCm) {
    // Use the physics-based formula: calories = steps × weight × height-based factor
    calories = estimateCaloriesBurned(steps, weightKg, heightCm);
  } else if (steps) {
    // Fallback simplified estimate scaled by weight (0.04 * steps for 70kg baseline)
    calories = Math.round(0.04 * steps * (weightKg / 70));
  }

  return { calories, distanceKm, durationMinutes, met: usedMet };
}
