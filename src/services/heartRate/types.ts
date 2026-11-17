// src/services/heartRate/types.ts

export interface HeartRateSample {
  bpm: number;
  steps: number | null; // 직전 샘플 이후 걸음 수 (모르면 null)
  timestamp: number; // ms
}

/**
 * 심박 데이터 공급원
 * subscribe는 구독 해제 함수를 돌려준다.
 */
export interface HeartRateSource {
  subscribe(onSample: (sample: HeartRateSample) => void): () => void;
}
