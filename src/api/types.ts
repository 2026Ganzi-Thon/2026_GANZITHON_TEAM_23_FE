// src/api/types.ts
// 공통 응답 / 오류 타입 (BE 명세가 확정되면 맞춰서 수정)

// 성공 응답: data 또는 message 중 하나가 내려옴
export interface ApiResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiFieldError {
  field: string;
  value: unknown;
  reason: string;
}

// 오류 응답 본문
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  errors: ApiFieldError[];
  path: string;
}

// 서버 오류 코드 + 클라이언트 전용 코드
export type ApiErrorCode =
  | "COMMON-001" // 입력값 형식 오류
  | "COMMON-002" // 서버 내부 오류
  | "AUTH-001" // 아이디 또는 비밀번호 불일치
  | "AUTH-002" // 이미 사용 중인 아이디
  | "AUTH-003" // 토큰 만료 / 인증 필요
  | "ALERT-001" // 알림을 찾을 수 없음
  | "PICTURE-001" // 그림을 찾을 수 없음
  | "RECORD-001" // 기록을 찾을 수 없음
  | "NETWORK" // 서버에 연결하지 못함
  | "TIMEOUT" // 응답 시간 초과
  | "UNKNOWN"; // 형식을 알 수 없는 오류 응답

// 마음 점수 (1 편안해요 ~ 5 많이 불안해요)
export type MoodScore = 1 | 2 | 3 | 4 | 5;
