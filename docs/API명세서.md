# 잠깐의 쉼 (pulse) API 명세서

| 항목 | 내용 |
|---|---|
| 버전 | v0.1 (초안) |
| 작성일 | 2026-11-15 |
| 기준 | FE 구현 (`src/api/`) |

---

## 1. 개요

불안한 순간을 애플워치 심박으로 감지해 알림을 띄우고, 숨은그림찾기로 지금 여기에 집중하도록 돕는 앱의 API입니다.

### 1.1 전체 흐름

```
[회원가입 / 로그인]
  POST /auth/signup  또는  POST /auth/login  →  accessToken 발급

[심박 → 알림]
  워치 → 앱으로 심박 수신 (앱 내부)
  앱이 급상승을 감지했을 때만 → POST /heart-rate/spikes
  서버가 shouldAlert=true 응답 → 앱이 "잠깐 같이 쉬어갈까요?" 알림 표시
    ├─ 바로 시작 → 활동 시작 (아래)
    └─ 괜찮아요 → POST /alerts/{alertId}/dismiss

[활동]
  GET /pictures/next?alertId=...   → 숨은그림 그림 + 찾을 사물 좌표
  (활동 전 점수 → 숨은그림찾기 → 쉬어가기 → 활동 후 점수)
  POST /records                    → 활동 기록 저장

[기록 보기]
  GET /records
```

### 1.2 API 목록

| 장 | Method | URL | 설명 | 인증 |
|---|---|---|---|---|
| 3.1 | POST | `/auth/signup` | 회원가입 | X |
| 3.2 | POST | `/auth/login` | 로그인 | X |
| 4.1 | POST | `/heart-rate/spikes` | 심박 급상승 보고 | O |
| 4.2 | POST | `/alerts/{alertId}/dismiss` | 알림 거절 (괜찮아요) | O |
| 5.1 | GET | `/pictures/next` | 숨은그림 받기 | O |
| 6.1 | GET | `/records` | 활동 기록 목록 | O |
| 6.2 | POST | `/records` | 활동 기록 저장 | O |

---

## 2. 공통 규칙

### 2.1 기본

| 항목 | 내용 |
|---|---|
| Base URL | `{서버 주소}/api/v1` |
| Content-Type | `application/json` |
| 인증 | `Authorization: Bearer {accessToken}` (1.2 표에서 인증 O인 API) |
| 시간 형식 | ISO 8601 (`2026-11-15T14:20:00+09:00`) |
| 필드 이름 | camelCase |

### 2.2 성공 응답

데이터가 있으면 `data`, 데이터 없이 결과만 알리면 `message`를 내려줍니다.

```json
{
  "success": true,
  "data": { }
}
```

```json
{
  "success": true,
  "message": "처리되었습니다."
}
```

### 2.3 오류 응답

FE는 `code`로 화면 분기를 하고, 알 수 없는 코드는 `message`를 그대로 보여줍니다.

```json
{
  "timestamp": "2026-11-15T14:20:00+09:00",
  "status": 400,
  "code": "COMMON-001",
  "message": "입력값을 확인해 주세요.",
  "errors": [
    { "field": "email", "value": "hello@", "reason": "이메일 형식이 아닙니다." }
  ],
  "path": "/api/v1/auth/signup"
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| timestamp | string | 오류 발생 시각 |
| status | number | HTTP 상태 코드 |
| code | string | 오류 코드 (2.4) |
| message | string | 사용자에게 보여줄 수 있는 문구 |
| errors | array | 필드별 오류 (없으면 빈 배열) |
| path | string | 요청 경로 |

### 2.4 오류 코드

| 코드 | HTTP | 설명 | 발생 API |
|---|---|---|---|
| COMMON-001 | 400 | 입력값 형식 오류 | 전체 |
| COMMON-002 | 500 | 서버 내부 오류 | 전체 |
| AUTH-001 | 401 | 아이디 또는 비밀번호 불일치 | 3.2 |
| AUTH-002 | 409 | 이미 사용 중인 아이디 | 3.1 |
| AUTH-003 | 401 | 토큰 없음 / 만료 / 위조 | 인증 O인 API 전체 |
| ALERT-001 | 404 | 알림을 찾을 수 없음 | 4.2 |
| PICTURE-001 | 404 | 내려줄 그림이 없음 | 5.1 |

### 2.5 공통 타입

| 이름 | 타입 | 값 |
|---|---|---|
| MoodScore | number | `1` 편안해요 ~ `5` 많이 불안해요 (정수) |

---

## 3. 인증

아이디 / 비밀번호 방식입니다. (소셜 로그인 없음)

### 3.1 회원가입

`POST /auth/signup`

가입과 동시에 로그인 처리하여 토큰을 내려줍니다.

**Request Body**

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| name | string | O | 앞뒤 공백 제거, 1~20자 |
| nickname | string | O | 앞뒤 공백 제거, 1~10자 |
| email | string | O | 이메일 형식 |
| loginId | string | O | 영문 · 숫자, 4~20자, 중복 불가 |
| password | string | O | 8자 이상 |

```json
{
  "name": "홍길동",
  "nickname": "길동",
  "email": "hello@example.com",
  "loginId": "pulse01",
  "password": "password123"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "userId": 1,
      "name": "홍길동",
      "nickname": "길동",
      "email": "hello@example.com",
      "loginId": "pulse01"
    }
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| accessToken | string | 이후 요청의 `Authorization` 헤더에 사용 |
| user.userId | number | 사용자 ID |
| user.name | string | 이름 |
| user.nickname | string | 닉네임 |
| user.email | string | 이메일 |
| user.loginId | string | 아이디 |

**Error**

| 코드 | 상황 | FE 처리 |
|---|---|---|
| AUTH-002 | 아이디 중복 | 아이디 입력 화면으로 돌아가 "이미 사용 중인 아이디예요." 표시 |
| COMMON-001 | 규칙 위반 | `message` 표시 |

### 3.2 로그인

`POST /auth/login`

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| loginId | string | O | 아이디 |
| password | string | O | 비밀번호 |

```json
{
  "loginId": "pulse01",
  "password": "password123"
}
```

**Response** `200 OK` — 3.1 응답과 동일 (`accessToken`, `user`)

**Error**

| 코드 | 상황 | FE 처리 |
|---|---|---|
| AUTH-001 | 아이디 또는 비밀번호 불일치 | 두 입력창에 "입력 내용을 확인해 주세요." 표시 |

---

## 4. 심박 · 알림

### 4.0 동작 방식

- 워치에서 받은 심박은 **앱 안에서만** 판단하고, 평소 데이터는 서버로 보내지 않습니다.
- 앱의 급상승 판단 기준 (FE `spikeDetector.ts`)
  - 평소 심박: 최근 정상 구간 샘플 평균
  - 평소 심박보다 **25bpm 이상** 높은 샘플이 **3번 연속**이고, 그 구간에 **걸음이 없을 때**
  - 한 번 보고하면 **10분** 동안 다시 보고하지 않음
- 알림을 실제로 띄울지는 **서버가 결정**합니다. (사용자별 기준값, 최근 "괜찮아요" 이력 등)

### 4.1 심박 급상승 보고

`POST /heart-rate/spikes`

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| bpm | number | O | 급상승 시점 심박 |
| baselineBpm | number | O | 직전까지의 평소 심박 (정수) |
| steps | number \| null | O | 같은 구간 걸음 수 (모르면 `null`) |
| measuredAt | string | O | 측정 시각 (ISO 8601) |

```json
{
  "bpm": 108,
  "baselineBpm": 74,
  "steps": 0,
  "measuredAt": "2026-11-15T14:20:00.000Z"
}
```

**Response** `200 OK`

| 필드 | 타입 | 설명 |
|---|---|---|
| shouldAlert | boolean | `true`면 앱이 알림을 띄움 |
| alertId | string \| null | 알림 ID. `shouldAlert=false`면 `null` |

```json
{
  "success": true,
  "data": {
    "shouldAlert": true,
    "alertId": "alert_20261115_0001"
  }
}
```

`alertId`는 이후 4.2 알림 거절, 5.1 그림 받기, 6.2 기록 저장에 그대로 전달됩니다.

### 4.2 알림 거절 (괜찮아요)

`POST /alerts/{alertId}/dismiss`

사용자가 알림에서 "괜찮아요"를 누르거나 알림을 닫았을 때 호출합니다. 서버는 해당 사용자의 기준값을 조금 올려 같은 알림이 덜 뜨게 합니다.

**Path**

| 이름 | 타입 | 설명 |
|---|---|---|
| alertId | string | 4.1에서 받은 알림 ID |

**Request Body** 없음

**Response** `200 OK`

```json
{
  "success": true,
  "message": "처리되었습니다."
}
```

**Error**

| 코드 | 상황 | FE 처리 |
|---|---|---|
| ALERT-001 | 알림 없음 | 무시 (사용자 흐름을 막지 않음) |

---

## 5. 숨은그림

### 5.1 숨은그림 받기

`GET /pictures/next`

활동을 시작할 때마다 호출합니다. 그림과 찾을 사물의 위치는 서버가 정하며, 매번 달라져도 됩니다.

**Query**

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| alertId | string | X | 알림에서 시작한 활동이면 4.1의 알림 ID. 홈에서 직접 시작하면 생략 |

**Response** `200 OK`

| 필드 | 타입 | 설명 |
|---|---|---|
| pictureId | string | 그림 ID (6.2 기록 저장에 사용) |
| imageUrl | string | 그림 이미지 URL (JPG / PNG) |
| aspectRatio | number | 이미지 `너비 / 높이` (예: 850×1850 → `0.4595`) |
| targets | array | 찾을 사물 목록 (1개 이상) |
| targets[].targetId | string | 사물 ID (그림 안에서 고유) |
| targets[].label | string | 사물 이름. 안내 문구에 사용 ("고양이를 하나씩 찾아주세요.") |
| targets[].emoji | string | 찾았을 때 표시할 이모지 |
| targets[].x | number | 사물 중심의 가로 위치. 이미지 너비 기준 비율 `0~1` |
| targets[].y | number | 사물 중심의 세로 위치. 이미지 높이 기준 비율 `0~1` |
| targets[].radius | number | 정답으로 인정할 반경. **이미지 너비 기준** 비율 `0~1` |

```json
{
  "success": true,
  "data": {
    "pictureId": "pic_park_01",
    "imageUrl": "https://cdn.example.com/pictures/park_01.jpg",
    "aspectRatio": 0.4595,
    "targets": [
      { "targetId": "cat-tree", "label": "고양이", "emoji": "🐱", "x": 0.136, "y": 0.195, "radius": 0.1 },
      { "targetId": "cat-rock", "label": "고양이", "emoji": "🐱", "x": 0.588, "y": 0.482, "radius": 0.08 },
      { "targetId": "cat-picnic", "label": "고양이", "emoji": "🐱", "x": 0.79, "y": 0.843, "radius": 0.13 }
    ]
  }
}
```

**좌표 기준**

```
(0,0) ───────────── x ─────────────▶ (1,0)
  │
  │        ● (x=0.5, y=0.25)
  y         ◯ radius = 이미지 너비 × 0.1
  │
  ▼
(0,1)                                (1,1)
```

- 좌표는 픽셀이 아니라 **비율**이라 기기 화면 크기와 상관없이 같은 위치를 가리킵니다.
- `radius`는 가로·세로 모두 **이미지 너비**를 기준으로 계산합니다.

**Error**

| 코드 | 상황 | FE 처리 |
|---|---|---|
| PICTURE-001 | 내려줄 그림 없음 | "그림을 불러오지 못했어요." + 다시 불러오기 |

---

## 6. 활동 기록

### 6.1 활동 기록 목록

`GET /records`

로그인한 사용자의 기록을 **최신순**으로 내려줍니다. 기록이 없으면 빈 배열입니다.

**Response** `200 OK`

| 필드 | 타입 | 설명 |
|---|---|---|
| recordId | number | 기록 ID |
| activityName | string | 활동 이름 (예: `"숨은그림찾기"`) |
| pictureId | string \| null | 사용한 그림 ID |
| beforeScore | MoodScore \| null | 활동 전 점수 (건너뛰면 `null`) |
| afterScore | MoodScore | 활동 후 점수 |
| createdAt | string | 기록 시각 (ISO 8601) |

```json
{
  "success": true,
  "data": [
    {
      "recordId": 2,
      "activityName": "숨은그림찾기",
      "pictureId": "pic_park_01",
      "beforeScore": 4,
      "afterScore": 2,
      "createdAt": "2026-11-15T14:25:00+09:00"
    },
    {
      "recordId": 1,
      "activityName": "숨은그림찾기",
      "pictureId": "pic_park_01",
      "beforeScore": null,
      "afterScore": 3,
      "createdAt": "2026-11-14T09:10:00+09:00"
    }
  ]
}
```

### 6.2 활동 기록 저장

`POST /records`

활동 후 점수를 고르고 "기록하기"를 누르면 호출합니다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| pictureId | string \| null | O | 5.1에서 받은 그림 ID |
| alertId | string \| null | O | 알림에서 시작했으면 알림 ID, 아니면 `null` |
| beforeScore | MoodScore \| null | O | 활동 전 점수 (건너뛰면 `null`) |
| afterScore | MoodScore | O | 활동 후 점수 |

```json
{
  "pictureId": "pic_park_01",
  "alertId": "alert_20261115_0001",
  "beforeScore": 4,
  "afterScore": 2
}
```

**Response** `201 Created` — 저장된 기록 1건 (6.1 항목과 같은 형태)

```json
{
  "success": true,
  "data": {
    "recordId": 3,
    "activityName": "숨은그림찾기",
    "pictureId": "pic_park_01",
    "beforeScore": 4,
    "afterScore": 2,
    "createdAt": "2026-11-15T14:30:00+09:00"
  }
}
```

**Error**

| 코드 | 상황 | FE 처리 |
|---|---|---|
| COMMON-001 | 점수가 1~5 정수가 아님 | 저장 실패해도 다음 화면으로 진행 |

---

## 7. 추후 논의

| 항목 | 내용 |
|---|---|
| 푸시 알림 | 앱이 꺼져 있을 때도 알림을 받으려면 기기 푸시 토큰 등록 API와 서버 푸시 발송이 필요 |
| 사물 영역 형식 | 사물 모양이 다양하면 `x, y, radius` 대신 범위(`x, y, width, height`)로 바꾸는 것 검토 |
| 보호자 연락처 | 도움 요청의 "보호자에게 문자"용 번호 저장 API |
| 토큰 갱신 | accessToken 만료 시간과 refresh 방식 |
