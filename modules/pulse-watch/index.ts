// modules/pulse-watch
// 애플워치 → 아이폰 심박 수신 네이티브 모듈 (iOS 전용)
// Android / 웹 / Expo Go에는 모듈이 없으므로 null이다. (requireOptionalNativeModule)

import { NativeModule, requireOptionalNativeModule } from "expo";

/** 워치 메시지 계약 v1 (wearable/INTEGRATION.md) */
export interface WatchHeartRateSample {
  schemaVersion: 1;
  sampleId: string;
  bpm: number;
  measuredAt: string; // UTC ISO 8601
  steps: number | null; // null = 알 수 없음 (0과 다름)
  stepsWindowStart: string;
  stepsWindowEnd: string;
  source: "healthKit" | "mock";
}

export interface WatchStatus {
  supported: boolean;
  activated?: boolean;
  paired?: boolean;
  watchAppInstalled?: boolean;
  reachable?: boolean;
  pendingCount?: number;
}

type PulseWatchEvents = {
  onHeartRateSample: (sample: WatchHeartRateSample) => void;
};

declare class PulseWatchModule extends NativeModule<PulseWatchEvents> {
  getPendingSamples(): Promise<WatchHeartRateSample[]>;
  markProcessed(sampleIds: string[]): void;
  getStatus(): WatchStatus;
}

export default requireOptionalNativeModule<PulseWatchModule>("PulseWatch");
