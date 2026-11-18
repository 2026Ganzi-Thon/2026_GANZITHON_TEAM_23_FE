import { requireOptionalNativeModule } from 'expo-modules-core';
import type { WatchHeartRateSample } from '../../src/services/heartRate/types';
export type { WatchHeartRateSample } from '../../src/services/heartRate/types';
export interface WatchStatus {
  supported: boolean;
  activated: boolean;
  reachable: boolean;
  paired?: boolean;
  watchAppInstalled?: boolean;
  installed: boolean;
  pendingCount?: number;
}
type NativeWatch = {
  getPending(): Promise<WatchHeartRateSample[]>;
  acknowledge(ids: string[]): Promise<void>;
  getStatus(): Promise<WatchStatus>;
  getTestOptions(): { enabled: boolean; run: string; shouldAlert: boolean };
  recordTestEvent(event: string, sampleId: string): void;
  addListener(name: string, listener: () => void): { remove(): void };
};
const native = requireOptionalNativeModule<NativeWatch>('PulseWatch');
// One receiver/delegate/inbox. Legacy names adapt to the same async durable API.
const watch = native ? {
  getPending: () => native.getPending(),
  getPendingSamples: () => native.getPending(),
  acknowledge: (ids: string[]) => native.acknowledge(ids),
  markProcessed: (ids: string[]) => native.acknowledge(ids),
  getStatus: () => native.getStatus(),
  getTestOptions: () => native.getTestOptions(),
  recordTestEvent: (event: string, id: string) => native.recordTestEvent(event, id),
  addListener: (name: string, listener: () => void) => native.addListener(name, listener),
} : null;
export default watch;
