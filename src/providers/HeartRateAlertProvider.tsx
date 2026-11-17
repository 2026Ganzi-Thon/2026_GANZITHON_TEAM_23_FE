// src/providers/HeartRateAlertProvider.tsx
// 심박 → 알림 흐름 (앱 전역)
//  1. 워치에서 들어온 심박 샘플을 앱이 계속 받는다.
//  2. 급상승을 감지했을 때만 서버로 보낸다. (평소 데이터는 보내지 않음)
//  3. 서버가 알림을 띄우라고 하면 08 부담 없는 알림을 어느 화면 위에서든 띄운다.
//     - 바로 시작 → 09 활동 전 상태 → 숨은그림찾기
//     - 괜찮아요 → 서버에 알림 거절 전달(기준값 상향) → 14 활동 기록

import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dismissAlert, reportHeartRateSpike } from "../api/heartRateApi";
import GentleAlertSheet from "../components/GentleAlertSheet";
import { createMockHeartRateSource } from "../services/heartRate/mockSource";
import { createSpikeDetector } from "../services/heartRate/spikeDetector";
import type { HeartRateSample } from "../services/heartRate/types";
import { watchHeartRateSource } from "../services/heartRate/watchSource";
import { getAccessToken } from "../utils/authStorage";
import { getSettings } from "../utils/settingsStorage";

type SpikeDetector = ReturnType<typeof createSpikeDetector>;

interface HeartRateAlertContextValue {
  /** 시연용: 모의 심박(지하철 시나리오)을 재생해 같은 흐름으로 알림을 띄운다. */
  runMockScenario: () => void;
}

const HeartRateAlertContext = createContext<HeartRateAlertContextValue>({
  runMockScenario: () => {},
});

export const useHeartRateAlert = () => useContext(HeartRateAlertContext);

export function HeartRateAlertProvider({ children }: { children: React.ReactNode }) {
  const [alertId, setAlertId] = useState<string | null>(null);
  const watchDetectorRef = useRef<SpikeDetector>(createSpikeDetector());
  const reportingRef = useRef(false);
  const stopMockRef = useRef<(() => void) | null>(null);

  /** 샘플 하나를 처리하고, 급상승을 서버에 보고했으면 true */
  const processSample = useCallback(
    async (detector: SpikeDetector, sample: HeartRateSample, ignoreSettings = false) => {
      const spike = detector.push(sample);
      if (!spike || reportingRef.current) return false;

      const [token, settings] = await Promise.all([getAccessToken(), getSettings()]);
      if (!token) return false; // 로그인 전에는 보내지 않음
      if (!settings.alertsEnabled && !ignoreSettings) return false;

      reportingRef.current = true;
      try {
        const result = await reportHeartRateSpike({
          bpm: spike.bpm,
          baselineBpm: spike.baselineBpm,
          steps: spike.steps,
          measuredAt: new Date(spike.measuredAt).toISOString(),
        });
        if (result.shouldAlert && result.alertId) setAlertId(result.alertId);
        return true;
      } catch (error) {
        console.warn("심박 급상승 보고 실패:", error);
        return false;
      } finally {
        reportingRef.current = false;
      }
    },
    [],
  );

  // 실제 워치 데이터 구독
  useEffect(
    () =>
      watchHeartRateSource.subscribe((sample) => {
        void processSample(watchDetectorRef.current, sample);
      }),
    [processSample],
  );

  const runMockScenario = useCallback(() => {
    stopMockRef.current?.();
    const detector = createSpikeDetector(); // 시연마다 새로 (쿨다운 영향 없음)
    const stop = createMockHeartRateSource().subscribe((sample) => {
      void processSample(detector, sample, true).then((reported) => {
        if (reported) stop();
      });
    });
    stopMockRef.current = stop;
  }, [processSample]);

  useEffect(() => () => stopMockRef.current?.(), []);

  const handleStart = () => {
    const id = alertId;
    setAlertId(null);
    router.push({ pathname: "/check-in", params: id ? { alertId: id } : {} });
  };

  const handleDecline = () => {
    if (alertId) dismissAlert(alertId).catch((error) => console.warn("알림 거절 전달 실패:", error));
    setAlertId(null);
    router.push("/records");
  };

  const handleClose = () => {
    if (alertId) dismissAlert(alertId).catch((error) => console.warn("알림 거절 전달 실패:", error));
    setAlertId(null);
  };

  const value = useMemo(() => ({ runMockScenario }), [runMockScenario]);

  return (
    <HeartRateAlertContext.Provider value={value}>
      {children}
      <GentleAlertSheet
        visible={alertId !== null}
        onStart={handleStart}
        onDecline={handleDecline}
        onClose={handleClose}
      />
    </HeartRateAlertContext.Provider>
  );
}
