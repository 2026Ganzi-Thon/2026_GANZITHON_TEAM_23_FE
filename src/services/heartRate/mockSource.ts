// src/services/heartRate/mockSource.ts
// 시연용 모의 심박 ("지하철 시나리오")
// 평소 심박으로 앉아 있다가, 걸음 없이 심박이 확 뛰는 구간을 재생한다.

import type { HeartRateSample, HeartRateSource } from "./types";

const SUBWAY_SCENARIO_BPM = [
  72, 74, 73, 75, 72, 74, 73, 76, 75, 74, // 평소
  88, 97, 104, 108, 110, 109, // 급상승 (걸음 없음)
  103, 95, 86, 80,
];

const SAMPLE_INTERVAL_MS = 150; // 시연이라 빠르게 재생

export const createMockHeartRateSource = (): HeartRateSource => ({
  subscribe(onSample: (sample: HeartRateSample) => void) {
    let index = 0;
    const timer = setInterval(() => {
      if (index >= SUBWAY_SCENARIO_BPM.length) {
        clearInterval(timer);
        return;
      }
      onSample({
        bpm: SUBWAY_SCENARIO_BPM[index],
        steps: 0,
        timestamp: Date.now(),
      });
      index += 1;
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(timer);
  },
});
