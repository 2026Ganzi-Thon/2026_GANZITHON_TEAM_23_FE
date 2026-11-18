// src/services/heartRate/spikeDetector.ts
// 심박 급상승 감지
// 규칙: "평소 심박보다 일정 이상 높고 걸음 수가 없음"이 연속으로 이어지면 급상승으로 본다.
// - 평소 심박: 최근 정상 구간 샘플의 평균 (급상승 구간 샘플은 평균에 넣지 않음)
// - 운동 등으로 걸음이 있으면 급상승으로 보지 않는다.
// - 한 번 보고한 뒤에는 쿨다운 동안 다시 보고하지 않는다.

import type { HeartRateSample } from "./types";

export interface SpikeDetectorOptions {
  deltaBpm: number; // 평소 대비 이만큼 이상 높으면 의심
  sustainSamples: number; // 의심 샘플이 연속으로 이 개수 이상이면 급상승
  baselineWindow: number; // 평소 심박 계산에 쓰는 최근 샘플 수
  minBaselineSamples: number; // 평소 심박을 믿기 위한 최소 샘플 수
  cooldownMs: number; // 보고 후 재보고 금지 시간
}

export interface HeartRateSpike {
  bpm: number;
  baselineBpm: number;
  steps: number | null;
  measuredAt: number;
}

export const DEFAULT_SPIKE_OPTIONS: SpikeDetectorOptions = {
  deltaBpm: 25,
  sustainSamples: 3,
  baselineWindow: 30,
  minBaselineSamples: 5,
  cooldownMs: 10 * 60 * 1000,
};

export const createSpikeDetector = (
  options: Partial<SpikeDetectorOptions> = {},
) => {
  const opts = { ...DEFAULT_SPIKE_OPTIONS, ...options };
  let baselineSamples: number[] = [];
  let suspectCount = 0;
  let lastReportedAt = -Infinity;

  const baseline = () =>
    baselineSamples.reduce((sum, bpm) => sum + bpm, 0) / baselineSamples.length;

  /** 샘플을 넣고, 급상승이면 결과를 돌려준다. */
  const push = (sample: HeartRateSample): HeartRateSpike | null => {
    const hasBaseline = baselineSamples.length >= opts.minBaselineSamples;
    // 걸음 null(알 수 없음)은 움직임 근거가 없으므로 판정을 막지 않는다.
    // 서버에는 null 그대로 보내 최종 판단에 쓰게 한다. (0으로 바꾸지 않음)
    const isMoving = sample.steps !== null && sample.steps > 0;
    const isHigh = hasBaseline && sample.bpm >= baseline() + opts.deltaBpm;

    // 오래된 샘플은 평소 심박 계산에만 쓰고 판정하지 않는다.
    if (sample.historical) {
      if (!isHigh) {
        baselineSamples = [...baselineSamples, sample.bpm].slice(-opts.baselineWindow);
      }
      return null;
    }

    if (!isHigh || isMoving) {
      suspectCount = 0;
      if (!isHigh) {
        baselineSamples = [...baselineSamples, sample.bpm].slice(-opts.baselineWindow);
      }
      return null;
    }

    suspectCount += 1;
    const inCooldown = sample.timestamp - lastReportedAt < opts.cooldownMs;
    if (suspectCount < opts.sustainSamples || inCooldown) return null;

    lastReportedAt = sample.timestamp;
    suspectCount = 0;
    return {
      bpm: sample.bpm,
      baselineBpm: Math.round(baseline()),
      steps: sample.steps,
      measuredAt: sample.timestamp,
    };
  };

  return { push };
};
