// src/api/mock.ts
// 더미 / 실서버 전환
// - 전체 기본값: EXPO_PUBLIC_USE_MOCK ("false"면 실서버, 그 외에는 더미)
// - BE 구현이 끝난 API는 아래 표에서 도메인별로 false로 바꿔 실서버에 연결한다.

import { ApiError } from "./client";
import type { ApiErrorCode } from "./types";

const MOCK_DEFAULT = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

// API명세서.md 장(章) 단위
export type ApiDomain = "auth" | "heartRate" | "picture" | "record" | "user";

export const USE_MOCK: Record<ApiDomain, boolean> = {
  auth: MOCK_DEFAULT, // 3장
  heartRate: MOCK_DEFAULT, // 4장
  picture: MOCK_DEFAULT, // 5장
  record: MOCK_DEFAULT, // 6장
  user: MOCK_DEFAULT, // 7장
};

/** 실제 서버처럼 약간의 지연 후 data만 돌려준다. (client.ts의 api.* 반환값과 같은 형태) */
export const mockResolve = <T>(data: T, delayMs = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delayMs));

/** 더미 오류 (실서버 오류와 같은 ApiError) */
export const mockReject = (
  status: number,
  code: ApiErrorCode,
  message: string,
  delayMs = 300,
): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError(code, message, status)), delayMs),
  );
