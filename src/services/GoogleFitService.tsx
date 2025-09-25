import GoogleFit, { Scopes } from 'react-native-google-fit';

export type DateRange = { startDate: string; endDate: string };

const AUTH_OPTIONS = {
  scopes: [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_ACTIVITY_WRITE,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_BODY_WRITE,
    Scopes.FITNESS_BLOOD_PRESSURE_READ,
    Scopes.FITNESS_BLOOD_PRESSURE_WRITE,
    Scopes.FITNESS_BLOOD_GLUCOSE_READ,
    Scopes.FITNESS_NUTRITION_READ,
    Scopes.FITNESS_SLEEP_READ,
  ],
};

export async function authorize(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // check auth state first
    await GoogleFit.checkIsAuthorized();
    if (GoogleFit.isAuthorized) {
      return { success: true };
    }
    console.log("object")
    const res = await GoogleFit.authorize(AUTH_OPTIONS);
    console.log(res, 'from Google Fit service');
    return { success: !!res.success, message: res.message ?? undefined };
  } catch (err: any) {
    return { success: false, message: err?.message ?? String(err) };
  }
}

// Utilities to build query options
function makeRange(daysBack = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysBack);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// Steps
export async function fetchDailyStepSamples(range?: Partial<DateRange>) {
  const opt = {
    ...(range ?? makeRange(7)),
    bucketUnit: 'DAY',
    bucketInterval: 1,
  };
  const res = await GoogleFit.getDailyStepCountSamples(opt);
  // res is array of sources — pick estimated_steps if available
  return res;
}

// Heart rate samples
export async function fetchHeartRateSamples(range?: Partial<DateRange>) {
  const opt = { ...(range ?? makeRange(7)) };
  const res = await GoogleFit.getHeartRateSamples(opt);
  return res;
}

// Calories
export async function fetchDailyCalories(range?: Partial<DateRange>) {
  const opt = {
    ...(range ?? makeRange(7)),
    bucketUnit: 'DAY',
    bucketInterval: 1,
  };
  const res = await GoogleFit.getDailyCalorieSamples(opt);
  return res;
}

// Sleep
export async function fetchSleepSamples(range?: Partial<DateRange>) {
  const opt = { ...(range ?? makeRange(1)) }; // default last day
  const res = await GoogleFit.getSleepSamples(opt);
  return res;
}

// Weight
export async function fetchWeightSamples(range?: Partial<DateRange>) {
  const todayRange = range ?? makeRange(7);
  const opt = {
    ...todayRange,
    unit: 'kg',
    bucketUnit: 'DAY',
    bucketInterval: 1,
    ascending: false,
  };
  const res = await GoogleFit.getWeightSamples(opt);
  return res;
}

// Blood Pressure
export async function fetchBloodPressure(range?: Partial<DateRange>) {
  const opt = { ...(range ?? makeRange(7)) };
  const res = await GoogleFit.getBloodPressureSamples(opt);
  return res;
}
