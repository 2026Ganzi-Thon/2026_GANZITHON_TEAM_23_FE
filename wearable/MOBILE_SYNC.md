# 모바일 최신 변경 통합 — 2026-11-18

대상 브랜치는 `feat/watch-expo-integration`이다. `git fetch origin` 후 모바일 기준 `55d1625`에서 최신 `7cff89cd95c544d295b8db290a8df8b2e73f5c3d`까지 비교해 작업 트리에 통합했다. 커밋·푸시 및 merge commit은 만들지 않았다. 원격 브랜치는 수정하지 않았다.

## 보존 및 선택

변경 전 추적/미추적 소스와 생성된 iOS 프로젝트 설정은 `/tmp/pulse-before-mobile-sync-20261118-022619/`에 백업했다. `workspace.tar.gz`, staged/unstaged patch, 파일 목록과 기준 해시를 포함한다. 백업에 환경 설정이 포함될 수 있으므로 공유하거나 커밋하지 않는다. 기존 파일 115개 모두 존재함을 확인했으며, 삭제한 파일은 없다. `expo prebuild --clean`은 실행하지 않았다.

최신 API 명세, AUTH003 처리, 사용자/보호자 API, OBJECT/COLOR 활동 모드, 후속 행동 기록 및 관련 화면을 채택했다. Settings 화면은 최신 UI를 유지하고 비동기 네이티브 상태 조회만 조정했다. 두 버전의 중복 수신 구현을 모두 등록하면 WCSession delegate가 충돌하므로, 기존 `PulseWatchModule.swift`와 AppDelegate subscriber를 단일 구현으로 유지했다. 최신 모바일의 별도 `WatchReceiver.swift`/`PulseWatchAppDelegate.swift` 구현은 추가하지 않았다. 호환 API 이름 `getPendingSamples`/`markProcessed`는 같은 영속 수신함에 연결한다.

Expo 앱 ID는 검증된 `com.ganzithon.team23.pulse`, 워치는 `.pulse.watchkitapp`을 유지했다. 최신 모바일의 `PulseReceiver` ID로 바꾸면 기존 임시 수신 앱과 충돌하므로 채택하지 않았다. 기존 Swift Receiver, 독립 워치 프로젝트, 공유 모델 symlink, config plugin, 임베디드 워치 타깃을 보존했다. Apple Team 설정은 최신 모바일 설정을 반영했으며 실제 기기 서명 권한은 별도 확인이 필요하다.

## 데이터 정책

- 수신함 파일 저장에 성공한 후 워치에 ACK한다. 저장 실패/수신함 한도 초과 시 성공 ACK를 보내지 않는다.
- JS 처리/API 실패 시 해당 샘플을 수신함에 남겨 재시도한다. 정상 처리 후에만 JS acknowledge로 제거한다.
- sampleId 중복 차단, 배치 시각순 처리, 이미 처리한 시각 이하 late sample 차단을 유지한다.
- 5분 초과 과거 데이터, 30초 초과 미래 데이터 및 명시적인 historical 샘플은 판정과 baseline에서 제외한다.
- 정상 baseline 최소 5개 후 +25 BPM 이상 3개 연속을 요구한다. 각 샘플의 직전 5분 steps가 모두 0이어야 한다. null/활동량 양수는 연속 조건을 끊으며 baseline에도 넣지 않는다.
- HealthKit/Mock baseline을 섞지 않는다. 일반 WC 감지는 Mock을 거부하고 명시적인 Debug 시뮬레이터 모드에서만 허용한다.
- API 성공 응답 후 10분 쿨다운을 확정·영속 저장한다. shouldAlert=false도 성공 보고다. API 실패 시 쿨다운을 소비하지 않는다.
- 서버 멱등성 키가 없어 서버 성공과 로컬 저장 사이의 크래시에서는 정확히 한 번의 API 보고를 보장하지 않는다.

## 로그인과 Mock 설정

실행 중 JS에서 모든 API 도메인이 Mock임을 확인했다. Mock 로그인은 토큰을 반환했지만 기존 무서명 시뮬레이터 빌드는 SecureStore 저장 시 `ERR_KEY_CHAIN / A required entitlement is not present`를 반환했다. 비밀번호 오류로 인한 실패가 아니었다.

Config plugin이 Apple Team과 시뮬레이터 전용 ad-hoc 서명 identity를 설정하도록 수정했다. 증분 서명 빌드 후 별도의 합성 키로 SecureStore 저장/읽기/삭제 성공을 확인했다. 기존 인증 키를 삭제하거나 인증정보를 로그에 출력하지 않았다. 일반 로그인 흐름은 그대로 유지하며, WC 자동 테스트의 명시적인 Debug 모드와 구분한다.

```sh
xcodebuild -workspace ios/pulse.xcworkspace -scheme pulse -configuration Debug \
  -destination 'platform=iOS Simulator,id=101B0B2B-D1D5-4E68-A493-303695E20087' \
  -derivedDataPath /tmp/pulse-expo-build CODE_SIGN_IDENTITY=- CODE_SIGNING_ALLOWED=YES build
```

로그인 시연 빌드에 `CODE_SIGNING_ALLOWED=NO`를 사용하지 않는다. `eas.json`의 development는 Mock API와 simulator를 사용하고, development-device는 실기기 Development Build용 프로필이다. 실제 백엔드 연결은 유효한 API URL·계정 및 `EXPO_PUBLIC_USE_MOCK=false` 설정이 필요하며 이번 작업에서 호출하지 않았다.

## 검증

최종 실행 결과와 미검증 범위는 [TESTING.md](TESTING.md)의 모바일 동기화 검증 절을 참고한다. 테스트 산출물과 백업은 커밋 대상이 아니다.
