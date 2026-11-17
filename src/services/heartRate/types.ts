// src/services/heartRate/types.ts

export interface HeartRateSample {
  bpm: number;
  steps: number | null; // 측정 구간 걸음 수 (null = 알 수 없음, 0과 다름)
  timestamp: number; // 측정 시각 (ms)
  historical?: boolean; // 오래된 샘플: 평소 심박 계산에만 쓰고 알림은 내지 않음
}

/**
 * 심박 데이터 공급원
 * subscribe는 구독 해제 함수를 돌려준다.
 */
export interface HeartRateSource {
  subscribe(onSample: (sample: HeartRateSample) => void): () => void;
}
