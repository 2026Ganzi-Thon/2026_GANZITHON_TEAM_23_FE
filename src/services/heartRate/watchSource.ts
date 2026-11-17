// src/services/heartRate/watchSource.ts
// 애플워치 심박 수신 (워치 앱은 별도 담당)
//
// TODO(워치 연동): 워치 → 아이폰 전송 방식이 정해지면 여기서 구독을 연결한다.
//  - WatchConnectivity로 직접 받는 경우: 네이티브 모듈(Expo Modules API + config plugin)에서
//    이벤트를 받아 onSample로 넘긴다.
//  - HealthKit에 저장된 값을 읽는 경우: HealthKit 조회 모듈을 붙여 주기적으로 onSample 호출.
// 지금은 연결 전이므로 아무 데이터도 보내지 않는다.

import type { HeartRateSource } from "./types";

export const watchHeartRateSource: HeartRateSource = {
  subscribe() {
    return () => {};
  },
};
