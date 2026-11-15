# PULSE 웨어러블 통합

이 구현은 `docs/API명세서.md` 4.0–4.1 기준이다. 원본 문서의 실제 파일 이름은 Unicode 분해형일 수 있다.
워치 → iPhone 내부 수신 → 모바일 spikeDetector.ts → 급상승에 한해 POST /heart-rate/spikes → shouldAlert=true인 경우 모바일 알림 순서다.
워치는 급상승 판정, 서버 API 호출, 알림을 하지 않는다. Receiver는 **최종 Expo 앱이 아닌 임시 Swift 통신 테스트 앱**이다.

## 파일 구조와 타깃

```
wearable/
  GanziWatch/GanziWatch.xcodeproj/project.xcproj  # Xcode 27 JSON 프로젝트 형식
  GanziWatch/HealthKit.entitlements
  GanziWatch/GanziWatch Watch App/
    GanziWatchApp.swift
    ContentView.swift
    HealthService.swift
  Shared/
    HeartRateSample.swift
    ConnectivityService.swift
  Receiver/PulseReceiverApp.swift
  Package.swift
  Tests/HeartRateSampleTests.swift
  INTEGRATION.md
  TESTING.md
```

- `GanziWatch Watch App`: 기존 Watch-only 타깃, 동일 bundle ID 유지. iPhone Receiver의 companion이 아니므로 이 타깃으로 통신 테스트하지 않는다.
- `PulseReceiver`: `com.ganzithon.team23.PulseReceiver`, 최소 Swift iOS 테스트 앱.
- `PulseCompanionWatch`: `com.ganzithon.team23.PulseReceiver.watchkitapp`. 기존 워치 Swift 파일과 Shared를 함께 컴파일한다. Receiver 안에 Watch Content로 내장된다.
- `WKCompanionAppBundleIdentifier`가 Receiver bundle ID와 일치한다. `WKRunsIndependentlyOfCompanionApp=YES`라 iPhone 앱 없이도 HealthKit을 읽을 수 있다.
- 기존 watchOS 최소 버전 27.2 유지, Receiver iOS 최소 버전 17.0. 실제 기기 OS가 워치 최소 버전보다 낮으면 두 워치 타깃의 Deployment Target을 설치된 OS에 맞춰 낮추고 다시 빌드한다.

## 메시지 계약 v1

WatchConnectivity property-list envelope:

```
type: "pulse.heartRate"
sampleId: String
payload: Data  // UTF-8 JSON; JS에 넘길 때 JSON 객체로 decode
```

```json
{
  "schemaVersion": 1,
  "sampleId": "HealthKit-sample-UUID",
  "bpm": 108,
  "measuredAt": "2026-11-15T05:20:00Z",
  "steps": null,
  "stepsWindowStart": "2026-11-15T05:15:00Z",
  "stepsWindowEnd": "2026-11-15T05:20:00Z",
  "source": "healthKit"
}
```

- 시간은 UTC ISO 8601, 초 정밀도. `measuredAt`은 HealthKit 샘플 endDate, 수신 시각이 아니다.
- steps는 해당 시각 직전 300초 안에 완전히 포함되는 HealthKit 걸음 샘플의 cumulativeSum이다. 경계에 걸치는 샘플은 제외하므로 완전한 활동 추정치가 아니다.
- 보이는 걸음 수 quantity가 없거나 읽기 실패이면 **null**. HealthKit은 읽기 거부와 데이터 부재를 구별해서 알려주지 않는다. null은 정지 상태가 아니다.
- 0은 조회된 quantity가 명시적으로 0인 경우만 허용한다. 실제 HealthKit은 정지 시간에 샘플을 쓰지 않을 수 있어 null이 흔하다. 실제 정지 판정의 데이터 정책은 모바일 팀이 추가 합의해야 한다. 현 구현은 결측치를 0으로 추정하지 않는다.
- `source=healthKit|mock`. healthKit은 현재 저장소에서 읽힌 샘플이며 센서의 직접 측정 명령이 아니다. 초기 동기화에는 최초 실행 직전 24시간의 과거 샘플과 다른 소스가 저장한 심박도 포함될 수 있다.
- Mock ID는 `mock-UUID`; 중복 시나리오는 동일 UUID를 재사용한다. Mock은 DEBUG 화면에서만 생성 가능하고 건강 저장소에 쓰지 않는다.
- `sampleId` 기준 중복 제거. 같은 시각에 별도 UUID가 있으면 별도 샘플이다. 버전·값·window 불일치는 수신 거부한다.

```typescript
export type WatchHeartRateSample = {
  schemaVersion: 1;
  sampleId: string;
  bpm: number;
  measuredAt: string;
  steps: number | null;
  stepsWindowStart: string;
  stepsWindowEnd: string;
  source: 'healthKit' | 'mock';
};
```

## 수집 및 전송 동작

공식 내장 HealthKit/WatchConnectivity만 사용한다. 읽기 권한은 heartRate·stepCount에만 요청하며 쓰기는 없다. requestAuthorization 성공은 읽기 승인 증거가 아니다.
HKObserverQuery를 앱 시작 때 복원하고, observer 알림 또는 수동 새로고침에서 HKAnchoredObjectQuery를 100개 단위로 읽는다. observer 완료 핸들러는 조회 및 로컬 전송함 저장 뒤 호출한다. anchor는 전송함 저장 이후에만 전진한다. 삭제 이벤트는 anchor 진행에 포함되지만 삭제 메시지는 전송하지 않는다.
최초 실행 때 직전 24시간을 시작점으로 영속 저장하며 이후 같은 predicate와 anchor를 사용한다. 초기 anchor가 없으면 이 시작점 이후의 보이는 심박 이력을 읽으므로 모바일은 과거 샘플에 알림을 내면 안 된다. 워치 최신 표시와 수신 앱의 최신 표시는 과거 전송 때문에 되돌아가지 않는다.

전송함은 UserDefaults에 저장되고 최대 2,000개이며 가득 차면 anchor를 전진하지 않는다. 연결 후 새로고침하면 재시도한다. reachable이면 sendMessage + sampleId ACK, 불가 또는 오류이면 transferUserInfo를 사용한다. WC 전송 완료 전까지 전송함은 유지된다. WC 전송 완료는 Expo JS 처리 완료를 의미하지 않는다. 송·수신 중복 ID는 최근 10,000개를 보관한다. 이 범위 밖의 재전송, 앱 삭제, 크래시 경계에서 exactly-once는 보장하지 않는다. 운영 Expo 앱은 SQLite 등으로 수신 원장과 처리 상태를 트랜잭션 저장해야 한다.

즉시 전송 실패와 백그라운드 전송 사이의 경합으로 중복이 발생할 수 있어 **수신 중복 제거가 필수**다. 재시도는 WC 재연결, 활성화, 앱 foreground, 새로고침에서 수행한다. 무한 타이머 재시도는 하지 않는다.

## Swift 수신 연결 예

Shared의 ConnectivityService가 실제 컴파일되는 전체 수신 예다. Expo 네이티브 모듈에서 아래 처리를 메인 큐 또는 전용 직렬 큐에서 수행한다. 앱에는 WCSession delegate를 하나만 둔다.

```swift
// session(_:didReceiveMessage:replyHandler:) 안의 예시
// 아래 persistAndDeduplicate / notifyJS는 Expo 팀이 구현할 저장소·이벤트 경계다.
guard message["type"] as? String == "pulse.heartRate",
      let data = message["payload"] as? Data,
      let sample = try? HeartRateSample.decode(data),
      message["sampleId"] as? String == sample.sampleId else {
    replyHandler(["ack": "invalid"])
    return
}
try persistAndDeduplicate(sample) // durable write가 성공한 뒤 ACK
replyHandler(["ack": sample.sampleId])
notifyJS(sample) // JS가 없으면 저장된 inbox를 다음 launch에서 drain
```

`didReceiveUserInfo`에도 같은 저장·검증·중복 제거를 적용한다. iOS sessionDidDeactivate에서는 activate()를 다시 호출한다. 앱 시작부터 WCSession을 초기화하고 JS 구독 이후로 초기화를 미루지 않는다.

## Expo Development Build 통합 절차

1. Expo Go에는 이 커스텀 WatchConnectivity 코드와 워치 타깃을 넣을 수 없다. 개발 앱에서 Expo local native module을 만들고 Development Build를 사용한다.
2. `Shared/HeartRateSample.swift`를 iOS 모듈에 추가한다. `ConnectivityService.swift`를 수신 구현 출발점으로 사용하되 영속 inbox, fetchPendingSamples/markProcessed, 이벤트 발행 경계를 구현한다. `Receiver/PulseReceiverApp.swift`는 UI 참고용이며 Expo 앱에 복사하지 않는다.
3. JS listener가 없는 백그라운드에서도 Swift에서 저장한다. JS 시작 시 저장된 데이터를 drain하고, sampleId 중복·시간 정렬·stale/future 샘플 정책을 적용한다. mock은 실서비스 spikeDetector/API 경로에서 차단한다.
4. Expo가 생성한 iOS Xcode 프로젝트에 실제 watchOS App 타깃을 추가하고 `GanziWatch Watch App/*.swift`와 Shared 파일의 타깃 멤버십을 지정한다. 기존 테스트 프로젝트는 참고용으로 유지한다.
5. 최종 워치 bundle ID를 최종 iOS ID의 하위 ID로 정하고 `WKCompanionAppBundleIdentifier`를 최종 iOS ID와 일치시킨다. `WKWatchOnly`는 companion 타깃에 넣지 않고 `WKRunsIndependentlyOfCompanionApp=YES`를 설정한다.
6. iOS 타깃의 dependency와 Embed Watch Content copy phase(`$(CONTENTS_FOLDER_PATH)/Watch`)에 워치 제품을 넣는다. 두 타깃의 Team·서명·version/build를 일치시키고 archive에서 내장을 검증한다.
7. 워치 타깃에 HealthKit 및 HealthKit Background Delivery entitlement, NSHealthShareUsageDescription을 설정한다. HealthKit을 직접 읽지 않는 iOS 수신 앱에는 HealthKit 권한이 필요 없다. WatchConnectivity 자체에는 별도 entitlement나 App Group이 필수가 아니다. 임의 background mode를 추가하지 않는다.
8. prebuild --clean으로 네이티브 변경이 사라지지 않도록 Expo config plugin 또는 관리되는 native project로 타깃·파일·설정을 재현한다. 본 저장소에는 Expo 프로젝트를 생성하거나 모바일 파일을 수정하지 않았다.
9. spikeDetector.ts가 정상 구간 평균 대비 +25 BPM, 연속 3개, 걸음 0, 10분 쿨다운을 판정한다. null을 0으로 변환하지 않는다. 샘플별 5분 window와 검출 구간의 걸음 정의를 맞춘다.
10. 검출한 경우만 `{bpm, baselineBpm, steps, measuredAt}`를 인증과 함께 POST /heart-rate/spikes에 보낸다. 응답 shouldAlert=true에서만 모바일 알림을 띄운다. 알림 권한은 모바일에서 별도 설정한다.

## 백그라운드와 앱 종료 제약

HealthKit background delivery 등록 성공은 고정 주기 심박 측정이나 실시간 전달을 보장하지 않는다. 운동 세션을 시작하지 않으며 상시 실행을 요구하지 않는다. OS 절전·착용 상태·보호 데이터 잠금·권한·네트워크·앱 종료 등에 따라 지연되거나 실행 기회가 없을 수 있다. observer는 깨우기 알림, anchored query는 실제 변경 읽기 역할이다.

sendMessage의 reachable은 항상 참인 연결 상태가 아니다. transferUserInfo는 시스템 스케줄링이고 시뮬레이터에서 지원되지 않으므로 실기기 검증이 필요하다. 강제 종료 후 즉시 재실행/전달을 전제로 설계하지 않는다. Expo JS는 앱 종료 상태에서 즉시 실행된다고 가정하면 안 된다. 본 테스트 앱은 최신 1개를 영속 표시하며 운영용 전체 수신 이력·서버 재시도·보안 저장소를 제공하지 않는다.

## 모바일 팀 체크리스트

- [ ] Expo Development Build와 재현 가능한 워치 타깃 설정
- [ ] WCSession 단일 delegate, native launch 초기화
- [ ] schemaVersion 검증, sampleId 영속 중복 제거, inbox drain
- [ ] timestamp 정렬·오래된 데이터 차단·mock 차단
- [ ] null과 0 구분 및 걸음 검출 구간 합의
- [ ] spikeDetector.ts 연결과 10분 쿨다운 영속 정책
- [ ] POST /heart-rate/spikes 인증·실패 재시도·중복 보고 정책
- [ ] shouldAlert 및 모바일 알림 권한 처리
- [ ] 실기기 foreground/background/종료/재연결 검증

Apple 공식 참고: [HealthKit 설정](https://developer.apple.com/documentation/xcode/configuring-healthkit-access), [Observer 완료 처리](https://developer.apple.com/documentation/healthkit/executing-observer-queries), [WatchConnectivity 전송](https://developer.apple.com/documentation/watchconnectivity/transferring-data-with-watch-connectivity), [transferUserInfo 시뮬레이터 제약](https://developer.apple.com/documentation/watchconnectivity/wcsession/transferuserinfo(_:)).

## 시뮬레이터 자동 검증 도구

`Shared/SimulatorTestSupport.swift`는 DEBUG 시뮬레이터에서만 명시적인 launch argument로 동작한다. `--pulse-test-run`으로 실행을 구분하고 워치는 `--pulse-send-base64`, iPhone은 `--pulse-inject-base64`로 UTF-8 JSON 배열을 base64로 받는다. source=mock만 허용하며 일반 실행이나 실기기·Release에서는 데이터 주입 및 테스트 기록을 하지 않는다. Expo 운영 수신 모듈로 이 테스트 도구를 복사할 필요는 없다.

수신 앱 화면과 기록의 `WatchConnectivity.sendMessage`는 실제 WC delegate 수신이고 `SIMULATOR MOCK INJECTION · WC 아님`은 iPhone 내부 주입이다. Debug 자동 실행은 UI의 시나리오 버튼과 동일한 enqueue/수신 검증 함수를 사용하되 버튼 탭 자체를 자동화하지 않는다. 시뮬레이터의 미지원 transferUserInfo 경로는 대기열에 남기며 reachable 이후 sendMessage로 재시도한다. 실기기 전송 구현은 기존 transferUserInfo를 유지한다.

실행 명령·최종 결과·오류 및 로컬 화면 보관 위치는 [TESTING.md 5절](TESTING.md#5-시뮬레이터-통합-테스트-실행-결과--2026-11-15)을 참고한다.
