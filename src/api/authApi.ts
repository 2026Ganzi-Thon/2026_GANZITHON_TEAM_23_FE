// src/api/authApi.ts
// 인증 API (아이디 / 비밀번호 방식, 소셜 로그인 없음)
// - 02 로그인, 03~05 회원가입

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";

export interface User {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  loginId: string;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  nickname: string;
  email: string;
  loginId: string;
  password: string;
}

const mockUser = (patch: Partial<User> = {}): User => ({
  userId: 1,
  name: "홍길동",
  nickname: "길동",
  email: "hello@example.com",
  loginId: "pulse01",
  ...patch,
});

/** 로그인 — 실패 시 ApiError("AUTH-001") */
export const login = async (body: LoginRequest): Promise<AuthResult> => {
  if (USE_MOCK.auth) {
    return mockResolve({
      accessToken: "mock-access-token",
      user: mockUser({ loginId: body.loginId }),
    });
  }
  return api.post<AuthResult>("/auth/login", body);
};

/** 회원가입 — 가입과 동시에 로그인 토큰을 받는다. 아이디 중복 시 ApiError("AUTH-002") */
export const signup = async (body: SignupRequest): Promise<AuthResult> => {
  if (USE_MOCK.auth) {
    const { password: _password, ...profile } = body;
    return mockResolve({
      accessToken: "mock-access-token",
      user: mockUser(profile),
    });
  }
  return api.post<AuthResult>("/auth/signup", body);
};
