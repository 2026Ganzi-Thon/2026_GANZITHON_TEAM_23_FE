export interface HeartRateSample {
  sampleId: string;
  bpm: number;
  steps: number | null; // Fully contained HealthKit step samples in preceding five minutes.
  timestamp: number;
  source: 'healthKit' | 'mock';
  historical?: boolean; // Compatibility: explicit historical input is never used to detect.
}
export interface WatchHeartRateSample {
  schemaVersion: 1;
  sampleId: string;
  bpm: number;
  measuredAt: string;
  steps: number | null;
  stepsWindowStart: string;
  stepsWindowEnd: string;
  source: 'healthKit' | 'mock';
}
export interface HeartRateSource {
  subscribe(onSample: (sample: HeartRateSample) => void | Promise<void>): () => void;
}
export function decodeWatchSample(value: unknown): HeartRateSample | null {
  const s = value as Partial<WatchHeartRateSample> | null;
  if (!s || s.schemaVersion !== 1 || typeof s.sampleId !== 'string' || !s.sampleId ||
      typeof s.bpm !== 'number' || !Number.isFinite(s.bpm) || s.bpm <= 0 ||
      !(s.steps === null || (Number.isInteger(s.steps) && s.steps! >= 0)) ||
      !['healthKit', 'mock'].includes(s.source ?? '') || typeof s.measuredAt !== 'string') return null;
  const timestamp = Date.parse(s.measuredAt);
  const start = Date.parse(s.stepsWindowStart ?? '');
  const end = Date.parse(s.stepsWindowEnd ?? '');
  if (!Number.isFinite(timestamp) || end !== timestamp || end - start !== 300000) return null;
  return { sampleId: s.sampleId, bpm: s.bpm, steps: s.steps!, timestamp, source: s.source! };
}
