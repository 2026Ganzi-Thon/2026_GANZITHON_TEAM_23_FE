// src/utils/signupDraft.ts
// 회원가입 3단계(03 → 04 → 05) 사이에 입력값을 들고 다니는 임시 저장소
// 비밀번호가 URL 파라미터에 남지 않도록 메모리에만 보관하고, 가입이 끝나면 비운다.

export interface SignupDraft {
  name: string;
  nickname: string;
  email: string;
  loginId: string;
}

const EMPTY_DRAFT: SignupDraft = { name: "", nickname: "", email: "", loginId: "" };

let draft: SignupDraft = { ...EMPTY_DRAFT };

export const getSignupDraft = (): SignupDraft => draft;

export const updateSignupDraft = (patch: Partial<SignupDraft>) => {
  draft = { ...draft, ...patch };
};

export const clearSignupDraft = () => {
  draft = { ...EMPTY_DRAFT };
};
