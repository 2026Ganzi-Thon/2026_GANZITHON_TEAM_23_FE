# 잠깐의 쉼 (pulse)

불안한 순간을 애플워치 심박으로 감지해 부담 없는 알림을 띄우고,
숨은그림찾기로 지금 여기에 집중하도록 돕는 Expo 앱입니다.

## 실행

```bash
npm install
npx expo start
```

`.env`의 `EXPO_PUBLIC_USE_MOCK=true`면 더미 API로 동작합니다. BE가 준비된 도메인은 `src/api/mock.ts`에서 하나씩 `false`로 바꿔 실서버에 연결합니다.

## 폴더 구조

```
src/
  app/          라우트 (Expo Router) — 화면 컴포넌트만 연결하는 얇은 파일
  screens/      실제 화면
  components/   공통 UI (common/ 버튼·입력창·카드 등)
  api/          도메인별 API + 더미 응답 (authApi, heartRateApi, pictureApi, recordApi)
  services/     심박 수신 · 급상승 감지 (heartRate/)
  providers/    앱 전역 상태 (심박 → 알림)
  constants/    색상 · 폰트 · 텍스트 스타일 · 도움 연락처
  utils/        저장소 · 검증 · 반응형 등
docs/           API명세서 등 협업 문서
wearable/       애플워치 앱 (워치 담당, wearable/INTEGRATION.md 참고)
```

## 화면 흐름

```
스플래시 → 로그인 ─┬→ 홈
                  └→ 회원가입 (이름·닉네임·이메일 → 아이디 → 비밀번호 → 완료) → 홈

홈 ─ 바로 시작 ─→ 활동 전 상태 → 숨은그림찾기 → 잠시 쉬어가기 → 활동 후 상태 → 다음 행동 선택
   ─ 활동 기록 ─→ 활동 기록 → 설정
모든 화면 상단 "도움 요청" → 도움 요청 (전화 / 문자 앱 연결)
```

## 심박 → 알림 → 그림

1. 워치에서 받은 심박을 앱이 계속 보다가 (`services/heartRate/watchSource.ts`, 워치 연동 담당 작업)
2. 평소보다 크게 높고 걸음이 없는 상태가 이어지면 급상승으로 판단 (`spikeDetector.ts`)
3. 급상승일 때만 서버로 보고 → 서버가 알림 여부를 결정 (`heartRateApi.reportHeartRateSpike`)
4. 알림에서 "바로 시작"을 누르면 숨은그림찾기 화면이 서버에서 그림을 받아와 띄움 (`pictureApi.getPicture`)

홈의 "모의 알림 확인하기"는 모의 심박(지하철 시나리오)을 재생해 같은 흐름을 시연합니다.
