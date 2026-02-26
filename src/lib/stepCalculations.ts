/**
 * Step Calculation Logic
 * Formula: steps = 100,000 / (height × Gender_constant × Weight_Adjustment)
 */

export interface UserMetrics {
  height: number; // in cm
  weight: number; // in kg
  gender: 'male' | 'female' | 'other';
}

// Gender constants based on stride length studies
const GENDER_CONSTANTS: Record<string, number> = {
  male: 0.43,
  female: 0.41,
  other: 0.42
};

// Calculate BMI and get weight adjustment
export function getWeightAdjustment(weight: number, height: number): number {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Weight adjustment reduces step length for higher BMI
  // Normal BMI (18.5-24.9) = 1.0
  // Overweight (25-29.9) = 0.95
  // Obese (30+) = 0.90
  
  if (bmi < 18.5) return 1.05; // Underweight - longer stride
  if (bmi <= 24.9) return 1.0;  // Normal weight
  if (bmi <= 29.9) return 0.95; // Overweight - slightly shorter stride
  return 0.90; // Obese - shorter stride
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
  const genderConstant = GENDER_CONSTANTS[userMetrics.gender] || 0.42;
  const weightAdjustment = getWeightAdjustment(userMetrics.weight, userMetrics.height);
  
  // Formula: steps = 100,000 / (height × Gender_constant × Weight_Adjustment)
  // This gives steps per kilometer
  const stepsPerKm = 100000 / (userMetrics.height * genderConstant * weightAdjustment);
  
  return Math.round(stepsPerKm * distanceKm);
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
  const genderConstant = GENDER_CONSTANTS[userMetrics.gender] || 0.42;
  const weightAdjustment = getWeightAdjustment(userMetrics.weight, userMetrics.height);
  
  const stepsPerKm = 100000 / (userMetrics.height * genderConstant * weightAdjustment);
  
  return parseFloat((steps / stepsPerKm).toFixed(2));
}

/**
 * Estimate calories burned from steps
 * Formula: calories = (weight × distance × 0.57) for average person
 * Adjusted for pace and intensity
 */
export function estimateCaloriesBurned(
  distanceKm: number,
  weight: number,
  intensity: 'slow' | 'moderate' | 'fast' = 'moderate'
): number {
  const baseCalories = weight * distanceKm * 0.57;
  
  const intensityMultipliers: Record<string, number> = {
    slow: 0.8,      // 3 km/h
    moderate: 1.0,  // 5 km/h
    fast: 1.3       // 6.5+ km/h
  };
  
  return Math.round(baseCalories * intensityMultipliers[intensity]);
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
  } else if (steps) {
    // Fallback simplified estimate scaled by weight (0.04 * steps for 70kg baseline)
    calories = Math.round(0.04 * steps * (weightKg / 70));
  }

  return { calories, distanceKm, durationMinutes, met: usedMet };
}
