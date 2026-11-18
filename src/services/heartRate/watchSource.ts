// src/services/heartRate/watchSource.ts
// 애플워치 심박 수신 (modules/pulse-watch 네이티브 모듈 → JS)
//
// 흐름: 워치 → WatchConnectivity → 아이폰 네이티브 수신함 → 여기서 정리 → spikeDetector
// - 구독 시작 / 앱이 다시 열릴 때: 네이티브 수신함에 쌓인 샘플을 가져온다. (앱이 꺼져 있던 동안 받은 것)
// - 앱이 켜져 있으면: 새 샘플을 이벤트로 바로 받는다.
// - sampleId 중복 제거, 측정 시각순 정렬, 실서비스에서 mock 차단
// - 10분보다 오래된 샘플은 historical로 표시 → 평소 심박 계산에만 쓰고 알림은 내지 않는다.
// iOS 개발 빌드에서만 동작한다. (Android / 웹 / Expo Go에는 모듈이 없어 아무것도 하지 않음)

import { AppState } from "react-native";
import PulseWatch, { type WatchHeartRateSample } from "../../../modules/pulse-watch";
import type { HeartRateSample, HeartRateSource } from "./types";

const STALE_MS = 10 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 60 * 1000;
const SEEN_LIMIT = 10000;

const toSample = (raw: WatchHeartRateSample, now: number): HeartRateSample | null => {
  const timestamp = Date.parse(raw.measuredAt);
  if (Number.isNaN(timestamp) || timestamp > now + FUTURE_TOLERANCE_MS) return null; // 미래 시각은 버림
  return {
    bpm: raw.bpm,
    steps: raw.steps,
    timestamp,
    historical: now - timestamp > STALE_MS,
  };
};

export const watchHeartRateSource: HeartRateSource = {
  subscribe(onSample) {
    const watch = PulseWatch;
    if (!watch) return () => {};

    const seen = new Set<string>();

    const handle = (samples: WatchHeartRateSample[]) => {
      const now = Date.now();
      const fresh = samples
        .filter((raw) => !seen.has(raw.sampleId))
        .sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt));

      for (const raw of fresh) {
        seen.add(raw.sampleId);
        if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value as string);

        // mock은 워치 DEBUG 화면에서만 만들어진다. 실서비스 판정 / API 경로에는 넣지 않음
        if (raw.source === "mock" && !__DEV__) continue;

        const sample = toSample(raw, now);
        if (sample) onSample(sample);
      }

      if (samples.length > 0) watch.markProcessed(samples.map((raw) => raw.sampleId));
    };

    const drainPending = () => {
      watch
        .getPendingSamples()
        .then(handle)
        .catch((error) => console.warn("워치 수신함 읽기 실패:", error));
    };

    const eventSub = watch.addListener("onHeartRateSample", (raw) => handle([raw]));
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") drainPending();
    });
    drainPending();

    return () => {
      eventSub.remove();
      appStateSub.remove();
    };
  },
};
