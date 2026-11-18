// src/api/heartRateApi.ts
// 심박 급상승 보고 API
// - 애플워치 → 앱으로 들어온 심박을 앱이 계속 보다가, 급상승을 감지했을 때만 서버로 보낸다.
// - 서버가 알림을 띄울지 판단해 alertId를 내려주면 08 부담 없는 알림을 띄운다.

import PulseWatch from "../../modules/pulse-watch";
import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";

export interface HeartRateSpikeReport {
  bpm: number; // 급상승 시점 심박
  baselineBpm: number; // 직전까지의 평소 심박
  steps: number | null; // 같은 구간 걸음 수 (움직임으로 인한 상승인지 구분)
  measuredAt: string; // ISO 8601
}

export interface HeartRateSpikeResult {
  shouldAlert: boolean;
  alertId: string | null;
}

/** 급상승 보고 */
export const reportHeartRateSpike = async (
  report: HeartRateSpikeReport,
): Promise<HeartRateSpikeResult> => {
  const test = PulseWatch?.getTestOptions();
  if (test?.enabled || USE_MOCK.heartRate) {
    const shouldAlert = test?.enabled ? test.shouldAlert : true;
    return mockResolve({ shouldAlert, alertId: shouldAlert ? `mock-alert-${Date.now()}` : null });
  }
  return api.post<HeartRateSpikeResult>("/heart-rate/spikes", report);
};

/** 알림에서 "괜찮아요" — 서버가 기준값을 조금 올려 같은 알림이 덜 뜨게 한다. */
export const dismissAlert = async (alertId: string): Promise<void> => {
  if (USE_MOCK.heartRate) {
    return mockResolve(undefined);
  }
  return api.post<void>(`/alerts/${alertId}/dismiss`);
};
