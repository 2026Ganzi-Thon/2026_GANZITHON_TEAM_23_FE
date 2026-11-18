import type { HeartRateSample } from './types';
export interface SpikeDetectorOptions {
  deltaBpm: number; sustainSamples: number; baselineWindow: number;
  minBaselineSamples: number; cooldownMs: number; maxAgeMs: number;
  allowMock: boolean; now: () => number; initialLastReportedAt: number;
}
export interface HeartRateSpike { bpm: number; baselineBpm: number; steps: number | null; measuredAt: number }
export const DEFAULT_SPIKE_OPTIONS: SpikeDetectorOptions = {
  deltaBpm: 25, sustainSamples: 3, baselineWindow: 30, minBaselineSamples: 5,
  cooldownMs: 600000, maxAgeMs: 300000, allowMock: false, now: Date.now, initialLastReportedAt: -Infinity,
};
export const createSpikeDetector = (options: Partial<SpikeDetectorOptions> = {}) => {
  const opts = { ...DEFAULT_SPIKE_OPTIONS, ...options };
  let baselineSamples: number[] = [];
  let suspectCount = 0;
  let lastTimestamp = -Infinity;
  let lastReportedAt = opts.initialLastReportedAt;
  let pending: HeartRateSample | null = null;
  let baselineSource: HeartRateSample['source'] | null = null;
  const seen = new Set<string>();
  const push = (sample: HeartRateSample): HeartRateSpike | null => {
    const age = opts.now() - sample.timestamp;
    if (sample.historical || pending || seen.has(sample.sampleId) || !Number.isFinite(sample.timestamp) || age > opts.maxAgeMs || age < -30000 ||
        (sample.source === 'mock' && !opts.allowMock) || !Number.isFinite(sample.bpm) || sample.bpm <= 0) return null;
    // Late samples cannot rewrite the already evaluated sequence. Batches are sorted at the source.
    if (sample.timestamp <= lastTimestamp) return null;
    if (baselineSource !== sample.source) { baselineSamples = []; suspectCount = 0; baselineSource = sample.source; }
    lastTimestamp = sample.timestamp;
    seen.add(sample.sampleId);
    if (seen.size > 10000) seen.delete(seen.values().next().value!);
    if (sample.steps !== 0) { suspectCount = 0; return null; }
    const baseline = baselineSamples.reduce((a, b) => a + b, 0) / baselineSamples.length;
    const isHigh = baselineSamples.length >= opts.minBaselineSamples && sample.bpm >= baseline + opts.deltaBpm;
    if (!isHigh) {
      suspectCount = 0;
      baselineSamples = [...baselineSamples, sample.bpm].slice(-opts.baselineWindow);
      return null;
    }
    suspectCount += 1;
    if (suspectCount < opts.sustainSamples || sample.timestamp - lastReportedAt < opts.cooldownMs) return null;
    pending = sample;
    return { bpm: sample.bpm, baselineBpm: Math.round(baseline), steps: 0, measuredAt: sample.timestamp };
  };
  // Only a successful API response consumes cooldown, including shouldAlert=false.
  const confirmReport = () => {
    if (pending) lastReportedAt = pending.timestamp;
    pending = null; suspectCount = 0;
    return lastReportedAt;
  };
  const reportFailed = () => {
    if (pending) { seen.delete(pending.sampleId); lastTimestamp = pending.timestamp - 1; }
    pending = null; suspectCount = opts.sustainSamples - 1;
  };
  return { push, confirmReport, reportFailed };
};
