// src/api/userApi.ts
// 마이페이지 API (API명세서 7장)
// - 보호자는 1명. 도움 요청의 "보호자에게 문자"는 이 번호로 휴대폰 문자 앱을 연다.

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import type { Guardian } from "./types";

export interface Me {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  loginId: string; // 수정 불가
  guardian: Guardian | null;
}

export type UpdateMeRequest = Partial<Pick<Me, "name" | "nickname" | "email">>;

// 더미 모드에서 앱을 켜 둔 동안 유지
let mockMe: Me = {
  userId: 1,
  name: "홍길동",
  nickname: "길동",
  email: "hello@example.com",
  loginId: "pulse01",
  guardian: null,
};

/** 보호자 번호는 숫자만 저장 */
export const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

/** 7.1 내 정보 조회 */
export const getMe = async (): Promise<Me> => {
  if (USE_MOCK.user) {
    return mockResolve({ ...mockMe });
  }
  return api.get<Me>("/users/me");
};

/** 7.2 내 정보 수정 — 보낸 필드만 바뀜 */
export const updateMe = async (body: UpdateMeRequest): Promise<Me> => {
  if (USE_MOCK.user) {
    mockMe = { ...mockMe, ...body };
    return mockResolve({ ...mockMe });
  }
  return api.patch<Me>("/users/me", body);
};

/** 7.3 보호자 등록·수정 */
export const saveGuardian = async (guardian: Guardian): Promise<Guardian> => {
  if (USE_MOCK.user) {
    mockMe = {
      ...mockMe,
      guardian: { name: guardian.name.trim(), phone: normalizePhone(guardian.phone) },
    };
    return mockResolve({ ...mockMe.guardian! });
  }
  return api.put<Guardian>("/users/me/guardian", guardian);
};

/** 7.4 보호자 삭제 (없어도 성공) */
export const deleteGuardian = async (): Promise<void> => {
  if (USE_MOCK.user) {
    mockMe = { ...mockMe, guardian: null };
    return mockResolve(undefined);
  }
  return api.delete<void>("/users/me/guardian");
};
