# 빌드 및 기기 검증

## 자동 검증 범위

Xcode 27.2 (27B52), 2026-11-15 실행 기준. 모든 빌드는 CODE_SIGNING_ALLOWED=NO.

| 검증 | 결과 |
|---|---|
| Xcode 프로젝트 로딩 및 4개 타깃 확인 | 성공 |
| 기존 GanziWatch Watch App, watchOS Simulator Debug | 성공 |
| PulseReceiver + 내장 PulseCompanionWatch, iOS Simulator Debug | 성공 |
| PulseReceiver + 내장 PulseCompanionWatch, 실기기 iOS/watchOS SDK Debug | 성공 (서명 제외) |
| Swift Package XCTest | 4개 통과, 실패 0 |
| iPhone Receiver 시뮬레이터 설치·프로세스 실행 | 성공 (통신 기능 미검증) |
| 기존 Watch-only 앱 시뮬레이터 설치·프로세스 실행 | 성공 (센서 기능 미검증) |
| 실제 HealthKit 권한·센서·백그라운드 전달·기기 간 통신 | 미검증 |
| Apple Developer 서명·설치·Archive 배포 | 미검증 |

최초 Xcode 프로젝트 편집 시 새 타깃 ID 누락으로 로딩이 실패했으며 수정 후 성공했다. 샌드박스에서 Xcode/Swift 캐시에 접근하지 못한 실행은 권한 허용 후 재실행했다. Swift 동시성 capture 경고는 수정했으며 남은 AppIntents metadata extraction skipped 경고는 해당 프레임워크를 사용하지 않아 발생한다.

공통 계약 테스트는 macOS에서 실행한다. 실제 HealthKit이나 WCSession 동작 검증을 대신하지 않는다.

```sh
swift test --package-path wearable --scratch-path /tmp/pulse-contract-build
xcodebuild -project wearable/GanziWatch/GanziWatch.xcodeproj \
  -scheme 'GanziWatch Watch App' -configuration Debug \
  -destination 'generic/platform=watchOS Simulator' \
  -derivedDataPath /tmp/pulse-watch-build CODE_SIGNING_ALLOWED=NO build
xcodebuild -project wearable/GanziWatch/GanziWatch.xcodeproj \
  -scheme PulseReceiver -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/pulse-ios-build CODE_SIGNING_ALLOWED=NO build
xcodebuild -project wearable/GanziWatch/GanziWatch.xcodeproj \
  -scheme PulseReceiver -configuration Debug -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/pulse-device-build CODE_SIGNING_ALLOWED=NO build
```

실행 로그는 `/tmp/pulse-{watch,ios,device,tests}.log`에 있으며 임시 경로이므로 영구 보존되지 않는다.

## 1. Apple Developer 서명 준비

1. Xcode에서 `wearable/GanziWatch/GanziWatch.xcodeproj`를 연다. 프로젝트 형식은 Xcode 27의 project.xcproj이다.
2. Xcode Settings → Accounts에서 본인 Apple Developer 계정을 추가한다.
3. iPhone과 Apple Watch를 페어링하고 개발자 모드를 켠다. iPhone을 Mac에 연결하고 기기 신뢰를 승인한다. Xcode Devices and Simulators에서 워치 연결 및 준비 완료를 확인한다.
4. `GanziWatch Watch App`, `PulseCompanionWatch`, `PulseReceiver` 및 필요 시 기존 `GanziWatch` 컨테이너의 Signing & Capabilities에서 동일 Team을 선택하고 Automatically manage signing을 켠다. 저장소의 기존 Team ID는 유지했으므로 본인 Team이 다르면 로컬에서 바꾼다.
5. bundle ID 등록 충돌 시 고유 ID를 사용한다. 통신용 워치 ID는 iPhone ID 아래에 두고 WKCompanionAppBundleIdentifier도 함께 수정한다.
6. 두 워치 타깃의 HealthKit, Background Delivery가 활성화되어 있는지 확인한다. `CODE_SIGN_ENTITLEMENTS=HealthKit.entitlements`, `com.apple.developer.healthkit=true`, `com.apple.developer.healthkit.background-delivery=true`를 프로젝트에 설정했다. 생성 Info.plist에는 NSHealthShareUsageDescription이 들어간다.
7. 계정/프로비저닝 프로파일에서 HealthKit entitlement를 허용해야 한다. Xcode 서명 오류가 나면 Developer Portal의 App ID capability와 프로파일을 갱신한다. 이 단계는 사용자 계정에서 수행해야 한다.
8. 두 워치 타깃의 현재 Deployment Target은 26.0이다. Xcode/SDK 버전 27.2와 앱의 최소 지원 OS 버전은 별개다. 기기 OS가 낮으면 설치 가능한 버전으로 조정 후 빌드한다.

## 2. iPhone 없이 실제 심박 읽기

1. scheme `GanziWatch Watch App`, 실행 대상 실제 Apple Watch를 선택하여 Run.
2. 워치에서 `HealthKit 읽기 권한`을 누르고 심박수·걸음 수 읽기를 허용한다.
3. 워치를 착용하고 기본 심박수 앱에서 새 측정을 만든 뒤 PULSE로 돌아와 새로고침한다. PULSE는 센서 측정을 강제로 시작하지 않는다.
4. 실제 BPM, 마지막 측정 시각, 최근/오래된 표시, 최근 5분 걸음을 확인한다. 기존 데이터는 최초 실행 직전 24시간부터 읽으며 페이지가 순차 처리될 수 있다.
5. 화면을 닫았다 다시 실행하여 최신 표시·anchor 복구와 중복 방지를 확인한다. 5분 이상 지나 새 샘플이 없으면 오래된 상태가 된다.
6. 읽기 거부 후 재실행해 오류/신규 데이터 없음 안내를 확인한다. 읽기 거부를 확정 표시하지 않는 것이 정상이다. 건강 앱의 앱 접근 설정에서 재승인한다.
7. iPhone 앱 미설치일 때는 전송 대기열에 저장되고 iPhone 미설치 상태가 표시된다. 기존 Watch-only 타깃은 Receiver와 통신할 수 없다.

## 3. 실제 iPhone 통신 테스트

1. `PulseReceiver` scheme을 선택하고 실제 페어링된 iPhone에 Run한다.
2. iPhone의 Watch 앱에서 PULSE companion 설치 상태를 확인한다. 자동 설치되지 않으면 사용 가능한 앱 목록에서 설치한다.
3. `PulseCompanionWatch` scheme을 실제 페어링된 워치 대상으로 Run한다. 통신 테스트는 이 타깃으로 한다. 화면 모양은 기존 워치 앱과 같으므로 scheme과 bundle ID를 확인한다.
4. iPhone Receiver와 워치를 열고 양쪽 연결 상태가 활성인지 확인한다. reachable 여부는 앱 상태에 따라 변하며 활성과 즉시 연결은 다르다.
5. 워치 Debug 화면에서 정상 Mock 전송 → iPhone의 MOCK, BPM, 시간, 걸음, 신규 수신 수를 확인한다.
6. 워치에 HealthKit 읽기 권한을 주고 새 실제 샘플을 수집 → iPhone에 실제 HealthKit 표시로 수신되는지 확인한다. Mock을 보낸 뒤에는 Mock보다 최신 실제 샘플이 와야 최신 화면이 실제 데이터로 바뀐다.
7. iPhone 앱을 백그라운드로 보내거나 연결을 끊고 샘플 생성 후 다시 연결한다. 지연 전달을 기다리며 필요하면 새로고침한다. 즉시 수신을 성공 기준으로 삼지 않는다.

## 4. 수동 시나리오 기록표 (아직 실행하지 않음)

| 시나리오 | 조작 / 기대 결과 |
|---|---|
| 정상 | 정상 버튼 → 72,74,73; 최근 표시 73, mock 표시 |
| 급상승 | 급상승 버튼 → 정상 3개 + 108,110,109; 최신 109, steps=0; 워치는 판정·알림하지 않음 |
| 활동 중 상승 | 활동 버튼 → 높은 심박에도 steps=120 |
| 걸음 결측 | 걸음 정보 없음 → iPhone에서 null / 알 수 없음, 0이 아님 |
| 중복 | 중복 버튼 → 같은 sampleId 두 번 enqueue, 신규 수신 수는 1 증가 |
| 연결 끊김 모의 | 오프라인 모의 ON → Mock 생성 → 대기 증가 → OFF → flush. 이미 WC에 넘긴 전송은 취소되지 않으므로 실제 네트워크 단절 검증과 다름 |
| 실제 연결 단절 | Bluetooth/Wi-Fi 연결 단절 → Mock/실제 데이터 저장 → 복구·재시도 → 중복 없이 수신 |
| 앱 재시작 | 전송 대기 중 워치 재실행, iPhone 재실행 → 전송함·최근 샘플·수신 중복 ID 복구 |
| 오래된 샘플 | 측정 5분 경과 → 오래된 표시; 모바일 통합 시 알림에 사용하지 않음 |
| 권한 거부 | HealthKit 읽기 거부 → 데이터 없음/오류 안내; 승인 성공으로 잘못 표시하지 않음 |
| 백그라운드 관찰 | 권한 승인 후 화면 종료 → 기본 심박 앱에서 새 측정 → 이후 PULSE 및 iPhone에서 전달 확인, 지연 기록 |
| 종료·잠금·절전 | 각 기기 상태별 지연/복구 확인; 강제 종료 상태 즉시 전송 보장하지 않음 |

수신 앱의 카운터는 이번 실행에서 새로 수신한 ID 수이고, 최신 샘플과 중복 ID는 영속 저장된다. 배치 Mock은 UI가 최종 최신값만 보여줄 수 있으므로 카운터 변화도 함께 본다. 이 앱은 전체 수신 이력을 표시하는 앱이 아니다.

## 5. 시뮬레이터 통합 테스트 실행 결과 — 2026-11-15

실제 HealthKit 센서를 사용하지 않고 **Mock 샘플을 실제 WatchConnectivity.sendMessage로 전송하는 테스트**와 **iPhone 앱 내부 Mock 주입 테스트**를 구분해서 실행했다. 아래 성공은 실제 기기의 센서·통신 성공을 의미하지 않는다.

환경은 Xcode 27.2 (27B52), iOS/watchOS 27.2다. 기존 페어 `A1E8276B-3ACE-4585-B6E5-422A1079C772`를 재사용했다.

- iPhone Air: `80CD9174-D192-4BBD-8D3B-718BC8D22D90`
- Apple Watch Series 12 (42mm): `00F85884-6A4F-4635-AE17-8F8D64ABC827`
- 최종 페어 상태: active, connected. 두 앱 설치·실행 및 스크린샷 확인 완료.
- 기존 기기 삭제·초기화·unpair를 하지 않았다. 다른 기존 페어도 유지했다.

| 검증 | 실제 WC sendMessage 수신 | 별도 iPhone Mock 주입 |
|---|---:|---:|
| 정상 (72,74,73 BPM / steps=0) | 3/3 일치 | 3/3 일치 |
| 급상승 (72,74,73,108,110,109 / steps=0) | 6/6 일치 | 6/6 일치 |
| 활동 중 상승 (동일 BPM / steps=120) | 6/6 일치 | 6/6 일치 |
| 걸음 결측 null | 이번 WC 배치에서 미검증 | 1/1 일치 |
| 동일 ID 재주입 | 이번 WC 배치에서 미검증 | 중복 1개 제외, 고유 수신 16개 |
| 현재 WC 배치 ACK | 15/15 확인 | 해당 없음 |
| 이전 실행 워치 전송 대기열 복구 | 15/15 수신·ACK 확인 | 해당 없음 |

각 샘플 전체 JSON을 비교했으며 sampleId, bpm, steps, measuredAt, 5분 window, schemaVersion, source가 일치했다. 정상·급상승·활동 시나리오 이름은 입력 데이터의 종류이며 급상승 판정 알고리즘의 테스트 결과가 아니다.

첫 실행은 페어 자체가 connected여도 워치 WCSession activation=0, reachable=false였고 iPhone에서 `counterpart app not installed`, 워치 데몬에서 `ACXErrorDomain Code=43 / App database is out of sync`를 기록했다. 40초 관찰 중 실제 수신은 0개였다. 이 실행에서만 명시적인 iPhone Mock 주입 경로로 수신 처리를 검증했다.

설치 정보가 갱신될 시간을 준 뒤 **빌드·재설치 없이 앱 프로세스만 재실행**하자 실제 sendMessage가 성공했다. 새 15개와 첫 실행 대기열 15개가 전달되어 Receiver 화면의 신규 수신은 30으로 표시된다. 최종 워치 화면은 `활성 · 즉시 연결 · 대기 0`이며, 수신 화면은 `WatchConnectivity.sendMessage`, `109 BPM`, `걸음 120`이다. 재실행 성공만으로 최초 오류의 근본 원인이 완전히 해소되었다고 단정하지 않는다.

첫 실행 결과와 주입 증거는 로컬 `test-results/latest/`에 보관했다. 테스트 JSON·로그·PNG는 커밋에서 제외하므로 GitHub에는 포함되지 않는다.

최종 실제 WC 수신·ACK 기록과 화면은 로컬 `test-results/retry/`에 보관했다. 위 표는 해당 실행 결과의 요약이다.

공통 모델 XCTest 4개를 재실행해 모두 통과했다. 증분 빌드 성공, 남은 경고는 AppIntents 미사용에 따른 metadata extraction skipped뿐이다. 사용자 인터페이스는 저장한 시뮬레이터 스크린샷을 직접 확인했다.

### 자동화 재실행

커밋에 포함된 Debug 실행 지원 코드는 `Shared/SimulatorTestSupport.swift`다. `scripts/simulator_integration.py`는 로컬 테스트 도구로만 유지하고 이번 Swift 소스·프로젝트 설정·문서 커밋에서는 제외했다. 아래 Python 명령은 해당 로컬 파일이 있는 환경에서만 사용할 수 있다. 새 체크아웃에서는 위 빌드·설치 절차와 워치의 Debug 시나리오 버튼으로 테스트한다. Shared 파일은 기존 폴더 타깃 멤버십으로 양쪽 앱에 포함되므로 프로젝트 파일 수정이 필요 없다. DEBUG + simulator + 명시적 실행 인자일 때만 Mock 자동 실행·기록·주입이 활성화된다. 실제 HealthKit 저장소에는 쓰지 않는다.

빌드 결과물이 `/tmp/pulse-ios-build`에 남아 있으면 프로젝트 루트에서 다음 명령만 실행하면 된다. 새 실행의 결과는 별도 폴더에 저장하여 기존 증거를 덮어쓰지 않는다.

```sh
python3 wearable/scripts/simulator_integration.py \
  --skip-install --output wearable/test-results/manual-run
```

앱이 시뮬레이터에 설치되지 않았다면 `--skip-install`을 빼면 된다. 스크립트는 사용 가능한 기존 페어 중 부팅된 페어를 우선 선택하며, 두 앱 설치·실행, 최대 40초 실제 WC 수신·ACK 대조, 실패 시 명시적 Mock 주입, 스크린샷·JSON 저장을 수행한다. **exit code 0만으로 실제 WC 성공을 판단하지 말고 result.json의 actualWatchConnectivity와 injection.performed를 확인한다.** 스크립트는 빌드를 실행하지 않으며, 코드가 바뀐 경우에만 위 빌드 명령으로 증분 빌드한다.

### 제약 및 사용자 직접 작업

- 이번 테스트를 완료하기 위해 사용자가 Xcode에서 직접 해야 할 작업은 없다. 두 시뮬레이터와 앱은 실행 상태로 남겼다.
- 이 실행 환경에서 `open -a Simulator` 및 Xcode 내부 기본 Simulator.app 경로로 GUI를 여는 것은 앱을 찾지 못해 실패했다. simctl 부팅·실행·캡처는 정상 동작했으며 GUI 열기 실패가 데이터 검증을 막지는 않았다. 화면은 로컬 test-results 폴더의 PNG에서 확인할 수 있다. 본인 Mac의 전체 Xcode GUI에서 확인하려면 **Xcode → Open Developer Tool → Simulator**를 사용한다.
- transferUserInfo는 Apple 문서상 시뮬레이터 미지원이다. 시뮬레이터에서는 해당 API 호출 대신 대기열을 보존하고 재연결 후 sendMessage로 재시도한다. 이 대기열 복구 성공을 백그라운드 전송 성공으로 해석하지 않는다. [Apple 공식 문서](https://developer.apple.com/documentation/watchconnectivity/wcsession/transferuserinfo(_:))
- 실제 센서 읽기·HealthKit 승인·실기기 백그라운드 전달·절전/잠금/강제 종료·서명 및 배포는 미검증이다.
- 모바일 Expo 및 백엔드 파일은 변경하지 않았다.

## 6. watchOS 26.0 최소 버전 검증

`GanziWatch Watch App`과 `PulseCompanionWatch`의 `WATCHOS_DEPLOYMENT_TARGET`을 모두 27.2에서 26.0으로 낮췄다. 두 타깃에 공통으로 적용되어 Debug/Release 모두 26.0을 사용한다. Swift 기능 코드와 iOS 타깃 설정은 변경하지 않았다.

- 기존 Watch-only 타깃 시뮬레이터 Debug 빌드: 성공.
- PulseReceiver와 내장 companion 워치 타깃 시뮬레이터 Debug 빌드: 성공.
- 두 워치 빌드 제품의 Info.plist `MinimumOSVersion`: 26.0 확인.
- Swift 계약 XCTest 재실행: 4개 통과, 실패 0.
- SwiftUI, HealthKit, WatchConnectivity 및 Debug 지원 코드가 watchOS 26.0을 대상으로 컴파일됐다. watchOS 27 전용 API의 무조건 호출로 인한 availability 오류는 없었으며 API 대체나 기능 변경은 필요하지 않았다.
- Xcode/SDK와 설치된 시뮬레이터 런타임은 27.2다. watchOS 26 런타임은 설치되지 않아 26에서의 실행은 미검증이다. Apple Watch SE 2의 watchOS 26 실기기 설치·서명·권한·센서 동작도 별도 확인이 필요하다.
- 빌드의 AppIntents metadata extraction skipped 경고는 기존과 동일하다.

이번 검증 로그는 로컬 `/tmp/pulse-watch26-standalone.log`, `/tmp/pulse-watch26-companion.log`, `/tmp/pulse-watch26-tests.log`에 보관하며 커밋 대상이 아니다. 빌드와 테스트 명령은 위의 기존 명령을 사용했다.

## 7. Expo + Watch 실제 WC 통합 검증 (2026-11-18)

통합 브랜치 `feat/watch-expo-integration`에서 모바일 SDK 58 소스와 기존 wearable 소스를 연결했다. 로그인·활동·기록 화면과 GentleAlertSheet 파일은 모바일 원본과 동일함을 바이트 비교로 확인했다. 커밋·푸시는 하지 않았다.

### 빌드 및 코드 검사

- Expo Development Build (`pulse`) + 내장 `PulseExpoWatch`: iPhone Air 시뮬레이터 대상 Debug 빌드 성공, 서명 제외.
- Expo 앱 `com.ganzithon.team23.pulse`, 최소 iOS 17.0.
- 워치 `com.ganzithon.team23.pulse.watchkitapp`, 최소 watchOS 26.0. Info.plist의 companion ID 일치 확인.
- `npx tsc --noEmit`: 통과.
- `npx expo lint`: 통과.
- `npm run test:heart-rate`: Node 단위 테스트 13개 통과. 정상·상승·활동·결측·과거/미래·중복·역순·API 실패 재시도·Mock opt-in·wire 변환·shouldAlert false/true·수신 배치 정렬 및 처리 후 ACK를 검증한다.
- 기존 Swift Package XCTest와 새 Mock 검출 조건 회귀 테스트: 5개 통과.
- 최종 config plugin을 재실행해 소스 갱신과 타깃 그래프 멱등성 통과.

첫 빌드는 앱 iOS 16.4 / 모듈 17.0 불일치로 실패했다. 이후 config plugin이 앱/Podfile 최소 버전을 모두 17.0으로 지정하도록 수정했다. 워치 내장 과정에서 node-xcode의 비어 있는 target dependency 섹션 및 literal undefined 그룹 경로 문제를 발견하여 plugin에서 명시적으로 생성·정규화했다. 최종 빌드에서 모두 해결됐다. CocoaPods는 시스템 Ruby 2.6에 맞는 Bundler/의존성을 /tmp에 격리 설치해 실행했다. 시스템 Ruby를 바꾸지 않았다.

### 실제 WatchConnectivity 종단 간 결과

사용 페어는 기존 iPhone Air + Apple Watch Series 12(42mm), `A1E8276B-3ACE-4585-B6E5-422A1079C772`다. 기존 임시 Receiver 앱 대신 **새 Expo 앱과 새 Expo companion 워치 타깃**을 설치했다.

| 시나리오 | 실제 WC 고유 수신 / JS 처리 / 워치 ACK | 앱 내부 알림 |
|---|---|---|
| 정상 baseline 5개 | 5 / 5 / 5 | 없음 |
| 활동 중 상승, baseline 5개 + 높은 값 3개 (steps=120) | 8 / 8 / 8 | 없음 |
| 걸음 결측 상승 (steps=null) | 8 / 8 / 8 | 없음 |
| 10분 전 데이터 | 8 / 8 / 8 | 없음 |
| 같은 sampleId 반복 (높은 값 하나만 고유) | 6 / 6 / 6 | 없음 |
| 정상 5개 + +25 BPM 이상 3개, API shouldAlert=false | 8 / 8 / 8 | 없음 |
| 정상 5개 + +25 BPM 이상 3개, API shouldAlert=true | 8 / 8 / 8 | 기존 GentleAlertSheet 표시 |

마지막 급상승은 108,110,109 BPM / steps=0이며 정상 baseline은 72,74,73,75,72다. 총 51개 고유 샘플의 실제 WC 수신·JS 처리·ACK를 확인했다. 중복은 워치 송신 계층에서도 억제되며, 검출기에서 동일 ID의 시각만 변경한 재전달도 별도 단위 테스트로 차단됨을 확인했다. shouldAlert=false 응답의 API 단계 기록과 true 응답의 알림 요청 기록도 확인했다.

이는 **워치에서 만든 Mock을 실제 WC로 보낸 테스트**다. API는 기존 Mock API를 사용했고, JS/네이티브 수신함에 직접 샘플을 주입하지 않았다. 단위 테스트의 메모리 입력과 실제 WC 통신 성공은 별도로 구분했다. 실제 HealthKit 센서 데이터는 사용하지 않았으며 기록에는 Mock ID·단계 및 Mock 샘플만 들어간다.

결과는 로컬 `wearable/test-results/expo-e2e/`의 `results.json`, 시나리오별 JSON/PNG에 있으며 Git에서 제외된다. 최초 개발 클라이언트 URL 확인창 때문에 JS가 시작되지 않은 실행은 네이티브 수신 8 / ACK 8 / JS 0이었다. SDK의 `--initialUrl http://127.0.0.1:8081` 실행 인자로 JS 로딩을 자동화한 후 전체 시나리오가 성공했다. API/화면이 성공하지 않은 최초 실행을 종단 간 성공으로 계산하지 않았다.

### 재실행

Metro를 실행한 상태에서:

```sh
npx expo start --dev-client --localhost --port 8081
# 다른 터미널: 두 앱이 정상 페어에 설치되어 있어야 함
python3 scripts/watch-expo-e2e.py
# 급상승 한 시나리오만 실행
python3 scripts/watch-expo-e2e.py --scenario spike
```

스크립트는 iPhone과 워치 프로세스를 테스트 실행 인자로 다시 시작한다. 이 명시적 DEBUG 시뮬레이터 모드에서만 로그인 없이 Mock API 시연을 허용하고, 실서비스에서는 Mock을 검출에 사용하지 않는다. 기존 모바일 로그인/화면 흐름을 변경한 것이 아니다.

백엔드 실제 호출·실기기 서명 및 센서·watchOS 26 런타임 실행·백그라운드 실시간 판정·종료 상태 시스템 알림·서버 성공과 로컬 ACK 사이의 크래시 복구 멱등성은 별도 검증/개선 항목이다. 네이티브 영속 수신함은 JS가 꺼져도 수신을 저장하지만 JS 검출기가 항상 실행되는 것은 아니다.

최종 알림 화면은 로컬 `wearable/test-results/expo-final/spike.png`에 별도로 저장했다. iOS URL 확인창은 /tmp의 임시 XCTest 도구로 자동 처리했고, 최종 실행은 SDK 개발 메뉴의 온보딩/자동 표시를 실행 인자로 끈 상태에서 실제 WC 8개 수신·JS 8개 처리·ACK 8개 및 가려지지 않은 GentleAlertSheet 표시를 다시 확인했다. 해당 UI 도구는 제품 프로젝트를 변경하지 않는다. 두 앱과 Metro는 실행 상태로 유지했다.

## 8. 최신 모바일 동기화 후 iPhone 17 재검증 (2026-11-18)

모바일 기준 `7cff89c`를 통합한 결과다. 선택·보존 정책 및 백업은 [MOBILE_SYNC.md](MOBILE_SYNC.md)에 기록했다.

- 서명 허용 Debug 시뮬레이터 빌드: `pulse`와 임베디드 `PulseExpoWatch` 성공. Config plugin에서 Apple Team 및 simulator ad-hoc identity를 설정했다. 기존 무서명 빌드에서 발생한 SecureStore `ERR_KEY_CHAIN`은 서명 빌드 후 합성 키 저장/읽기/삭제로 해결을 확인했다.
- JS 계약/API 테스트: **18/18 성공**. 기존 null/오래된 데이터/중복/순서/쿨다운/재시도 테스트에 historical 및 최신 사용자·보호자·OBJECT/COLOR·후속 행동·Mock 로그인 API 테스트를 추가했다.
- Swift 계약 테스트: **5/5 성공**. 타입 검사와 Expo lint 성공.
- 실제 사용 페어: **iPhone 17** `101B0B2B-D1D5-4E68-A493-303695E20087` + **PULSE iPhone17 Watch Series12 (42mm)** `DE0DACC1-AB12-492D-B864-99F3D5CEFC2D`. Pair `F50FF5CA-C31C-48D2-B315-B593631A713E` active/connected. 기존 Air 페어도 보존했다.

| 실제 WC 시나리오 | 고유 수신 / JS / ACK | 알림 |
|---|---|---|
| 정상 5개 | 5 / 5 / 5 | 없음 |
| 활동 중 상승 steps=120 | 8 / 8 / 8 | 없음 |
| 상승 steps=null | 8 / 8 / 8 | 없음 |
| 10분 전 데이터 | 8 / 8 / 8 | 없음 |
| 동일 sampleId 반복 | 6 / 6 / 6 | 없음 |
| API shouldAlert=false | 8 / 8 / 8 | 없음 |
| API shouldAlert=true | 8 / 8 / 8 | GentleAlertSheet 표시 |

**7/7 시나리오, 총 51개 고유 샘플**의 실제 `WatchConnectivity.sendMessage` 송수신·ACK를 확인했다. API는 Mock이며 직접 수신함/JS 주입은 사용하지 않았다. 마지막 상승 값은 109 BPM, steps=0이다. 결과 JSON과 화면은 Git 제외 경로 `wearable/test-results/mobile-sync-e2e/`에 있다.

```sh
python3 scripts/watch-expo-e2e.py \
  --phone 101B0B2B-D1D5-4E68-A493-303695E20087 \
  --watch DE0DACC1-AB12-492D-B864-99F3D5CEFC2D \
  --output wearable/test-results/mobile-sync-e2e
```

제품 코드와 분리한 `/tmp/PulseUIAutomation`의 XCUITest **2/2 성공**: 실제 WC로 표시된 알림에서 ‘바로 시작’ → ‘그림 찾기 시작’ → 최신 그라운딩 화면, 일반 실행의 저장된 로그인 복구 → 기록 → 설정 → 마이페이지 이름/닉네임/보호자 입력 화면을 확인했다. 앞선 로그인 UI 실행에서는 실제 Mock 로그인 제출 및 홈 진입을 확인했으나 화면 아래 기록 버튼 탭에서 실패했다. 스크롤을 포함한 재검사로 해결했고 제품 UI는 수정하지 않았다.

최초 Swift 테스트는 sandbox 캐시 접근 제한으로 실행되지 않았으나 권한 있는 환경에서 위 5개를 다시 실행해 통과했다. 실제 백엔드, 실제 센서/기기, watchOS 26 런타임 실행, 종료 상태 시스템 알림 및 백그라운드 실시간 감지는 검증하지 않았다. 서명 빌드는 27.2 SDK 시뮬레이터에서 수행했다. merge commit/일반 commit/push는 만들지 않았다.

## 9. PR #4 origin/main 병합 후 재검증

`1490853` main을 통합 브랜치에 병합한 후 검증했다. 충돌 정책은 [MOBILE_SYNC.md](MOBILE_SYNC.md)의 PR #4 절에 기록했다. main 대비 연동과 무관한 모바일 화면/API 차이는 없음을 파일 단위로 확인했다.

- `npm ci --no-audit --no-fund`: 803개 패키지 설치 성공, lockfile 변경 없음. 첫 sandbox 설치는 캐시 쓰기 권한으로 실패해 정상 권한에서 재실행했다.
- `npx tsc --noEmit`, `npm run lint`: 성공. `npm run test:heart-rate`: 18/18, Swift 계약 테스트: 5/5 성공.
- `pulse` + `PulseExpoWatch` Debug 시뮬레이터 서명 빌드 성공. 첫 시도는 npm 재설치 중 의존 파일 부재로 실패했으며 설치 완료 후 재빌드로 해결했다. 생성 iOS 프로젝트를 수동 수정하거나 clean prebuild하지 않았다.
- 기존 iPhone 17 + 전용 Watch Series12 페어에 새 빌드를 설치했다. 일반 실행의 native testOptions.enabled=false, Mock API 도메인 모두 true를 실행 중 JS에서 확인했다. Metro는 `EXPO_PUBLIC_USE_MOCK=true` 프로세스 환경으로 실행했다.
- 별도의 임시 XCUITest에서 실제 로그인 화면에 합성 아이디/비밀번호를 입력해 Mock 로그인 → SecureStore 저장 → 홈 이동 성공 (1/1). 처음에는 딥링크 iOS 열기 확인창에 막혔으나 테스트 도구가 확인창을 처리하도록 고쳐 통과했다. 제품 인증/UI 코드는 변경하지 않았다.
- 실제 WC 7/7 시나리오 성공: 정상 5, 활동 8, 결측 8, 과거 8, 중복 6, shouldAlert=false 8, shouldAlert=true 8. 총 51개 고유 sendMessage/네이티브 수신/JS/워치 ACK의 sampleId 집합이 각각 정확히 일치했다. 직접 아이폰/JS 수신함 주입은 사용하지 않았다. shouldAlert=true에서만 기존 GentleAlertSheet가 표시됐다.
- 추가 XCUITest 2/2: WC 알림 → 바로 시작 → 그림 찾기, 일반 로그인 복구 → 기록 → 설정 → 최신 마이페이지/보호자 화면 확인.

결과는 Git 제외 `wearable/test-results/pr4-merge-e2e/`, 빌드/테스트 로그는 `/tmp/pulse-pr4-*`에 있다. 실제 백엔드, 실기기 센서, watchOS 26 런타임 및 백그라운드/종료 상태 실시간 실행은 검증 범위 밖이다. 테스트 완료 후 main 자체나 다른 작업 브랜치에 직접 커밋/푸시하거나 PR을 직접 병합하지 않는다.
