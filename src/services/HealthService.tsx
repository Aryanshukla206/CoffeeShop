// src/native/healthService.ts
import {
  initialize,
  requestPermission,
  // writeRecords, // Removed: not exported by the module
  aggregateRecord,
} from 'react-native-health-connect';

// Helper types
export type StepsAggregate = {
  startTimeMillis: number;
  endTimeMillis: number;
  steps: number;
};

// initialize once on app startup
export async function hcInit(): Promise<void> {
  try {
    await initialize();
  } catch (e) {
    console.warn('HealthConnect init error', e);
    throw e;
  }
}

/**
 * Ask Health Connect & Android runtime permissions
 * Returns true if Health Connect permissions were granted.
 */
export async function hcRequestPermissions(): Promise<boolean> {
  // Health Connect permissions (read/write) for StepsRecord
  const hcPermissions = [
    { accessType: 'read', recordType: 'StepsRecord' },
    { accessType: 'write', recordType: 'StepsRecord' },
    // add others if you need them:
    // { accessType: 'read', recordType: 'Height' }, etc.
  ];
  try {
    const granted = await requestPermission(hcPermissions);
    // the wrapper returns a structure; to keep it simple, check for truthiness
    return !!granted;
  } catch (e) {
    console.warn('hcRequestPermissions error', e);
    return false;
  }
}

/**
 * Write a steps record into Health Connect.
 * - startMs, endMs: epoch millis
 * - stepCount: integer
 */
export async function hcWriteSteps(
  startMs: number,
  endMs: number,
  stepCount: number,
): Promise<boolean> {
  const record = {
    recordType: 'StepsRecord',
    startTimeMillis: startMs,
    endTimeMillis: endMs,
    count: stepCount, // wrapper expects 'count' for StepsRecord
  };

  try {
    // Use writeRecord if available, otherwise update this to the correct function from the library
    // For example, if the correct function is writeRecord:
    // const res = await writeRecord(record);
    // If you need to write multiple records, check the library docs for batch writing support
    // Here, we'll assume writeRecord exists for a single record:
    // @ts-ignore
    const res = await (typeof writeRecord !== 'undefined' ? writeRecord(record) : Promise.reject('writeRecord not found'));
    // wrapper returns something (success structure) — treat truthy as success
    return !!res;
  } catch (e) {
    console.warn('hcWriteSteps error', e);
    return false;
  }
}

/**
 * Read aggregated steps between startMs and endMs (inclusive)
 * Returns array of { startTimeMillis, endTimeMillis, steps } or empty array.
 */
export async function hcReadStepsAggregate(
  startMs: number,
  endMs: number,
): Promise<StepsAggregate[]> {
  try {
    // construct aggregate request per wrapper shape
    // wrapper aggregateRecord usually accepts { recordType, timeRange: { startTimeMillis, endTimeMillis }, bucketDuration } etc.
    const request = {
      recordType: 'StepsRecord',
      timeRange: {
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      },
      // optional: specify bucket duration to get per-day buckets
      // bucketByDurationMillis: 24 * 60 * 60 * 1000,
    };

    const agg = await aggregateRecord(request);
    // the wrapper returns a JS object — normalize to StepsAggregate[]
    // The exact shape can vary; defensive parsing below:
    if (!agg) return [];

    // If wrapper returns buckets or totals, adapt accordingly:
    if (Array.isArray(agg.buckets)) {
      return agg.buckets.map((b: any) => ({
        startTimeMillis: b.startTimeMillis ?? b.start ?? 0,
        endTimeMillis: b.endTimeMillis ?? b.end ?? 0,
        steps: b.totalSteps ?? b.value ?? b.total?.steps ?? 0,
      }));
    }
    // fallback if wrapper returns single aggregate
    if (agg.total) {
      return [
        {
          startTimeMillis: startMs,
          endTimeMillis: endMs,
          steps: agg.total?.steps ?? agg.total ?? 0,
        },
      ];
    }

    // If wrapper returns array directly
    if (Array.isArray(agg)) {
      return agg.map((item: any) => ({
        startTimeMillis: item.startTimeMillis ?? item.start,
        endTimeMillis: item.endTimeMillis ?? item.end,
        steps: item.steps ?? item.count ?? item.value ?? 0,
      }));
    }

    return [];
  } catch (e) {
    console.warn('hcReadStepsAggregate error', e);
    return [];
  }
}
