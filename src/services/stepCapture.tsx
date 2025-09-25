// src/native/jsStepCapture.ts
import {
  SensorTypes,
  accelerometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';
import { hcWriteSteps } from './healthService'; // your healthService wrapper
import { Platform } from 'react-native';

// set accelerometer update interval (ms)
setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 10 Hz

type Listener = { remove: () => void } | null;

let subscription: Listener = null;
let lastPeakTime = 0;
let stepCountHeuristic = 0;

/**
 * Very simple peak-based step detector:
 *  - computes magnitude of acceleration vector
 *  - counts a step when magnitude crosses threshold and cooldown passed
 */
export function startJsStepCapture(
  onStep?: (delta: number, total: number) => void,
) {
  stepCountHeuristic = 0;
  const THRESHOLD = 12.0; // tune per device
  const COOLDOWN_MS = 300;

  // unsubscribe existing
  if (subscription && typeof (subscription as any).remove === 'function') {
    (subscription as any).remove();
    subscription = null;
  }

  subscription = accelerometer.subscribe(
    ({ x, y, z, timestamp }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (mag > THRESHOLD && now - lastPeakTime > COOLDOWN_MS) {
        lastPeakTime = now;
        stepCountHeuristic += 1;
        onStep && onStep(1, stepCountHeuristic);

        // write small delta to Health Connect
        // write last 2 seconds window as the step time range
        try {
          const endMs = now;
          const startMs = now - 2000;
          hcWriteSteps(startMs, endMs, 1).catch(e => {
            console.warn('hcWriteSteps failed', e);
          });
        } catch (e) {
          console.warn('write error', e);
        }
      }
    },
    error => {
      console.warn('accelerometer error', error);
    },
  );

  return () => {
    if (subscription && typeof (subscription as any).remove === 'function') {
      (subscription as any).remove();
      subscription = null;
    }
  };
}

export function stopJsStepCapture() {
  if (subscription && typeof (subscription as any).remove === 'function') {
    (subscription as any).remove();
    subscription = null;
  }
}
