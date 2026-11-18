import { AppState } from 'react-native';
import PulseWatch from '../../../modules/pulse-watch';
import { decodeWatchSample, type HeartRateSource } from './types';

export const watchHeartRateSource: HeartRateSource = {
  subscribe(onSample) {
    if (!PulseWatch) return () => {};
    let stopped = false;
    let draining = false;
    let requested = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const drain = async () => {
      requested = true;
      if (stopped || draining) return;
      draining = true;
      try {
        do {
          requested = false;
            const samples = (await PulseWatch!.getPending()).sort((a,b) => Date.parse(a.measuredAt)-Date.parse(b.measuredAt) || a.sampleId.localeCompare(b.sampleId));
          for (const raw of samples) {
            if (stopped) break;
            const sample = decodeWatchSample(raw);
            if (sample) await onSample(sample);
            await PulseWatch!.acknowledge([raw.sampleId]);
          }
        } while (requested && !stopped);
      } catch {
        // Leave failed sample and all later samples in durable native inbox.
        retry = setTimeout(() => { void drain(); }, 5000);
      } finally { draining = false; }
    };
    const listener = PulseWatch.addListener('onSamplesAvailable', () => { void drain(); });
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void drain(); });
    void drain();
    return () => { stopped = true; clearTimeout(retry); listener.remove(); appState.remove(); };
  },
};
