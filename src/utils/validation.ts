// src/utils/validation.ts
// 회원가입 입력 검증. 통과하면 null, 실패하면 안내 문구를 돌려준다.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_ID_PATTERN = /^[A-Za-z0-9]{4,20}$/;

export const NAME_MAX_LENGTH = 20;
export const NICKNAME_MAX_LENGTH = 10;
export const PASSWORD_MIN_LENGTH = 8;

export const validateName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "이름을 입력해 주세요.";
  if (trimmed.length > NAME_MAX_LENGTH)
    return `이름은 ${NAME_MAX_LENGTH}자까지 입력할 수 있어요.`;
  return null;
};

export const validateNickname = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "닉네임을 입력해 주세요.";
  if (trimmed.length > NICKNAME_MAX_LENGTH)
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자까지 입력할 수 있어요.`;
  return null;
};

export const validateEmail = (value: string) =>
  EMAIL_PATTERN.test(value.trim()) ? null : "이메일 형식을 확인해 주세요.";

export const validateLoginId = (value: string) =>
  LOGIN_ID_PATTERN.test(value.trim())
    ? null
    : "영문과 숫자로 4자 이상 입력해 주세요.";

export const validatePassword = (value: string) =>
  value.length >= PASSWORD_MIN_LENGTH
    ? null
    : `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해 주세요.`;

export const validatePasswordConfirm = (password: string, confirm: string) => {
  if (!confirm) return "비밀번호를 한 번 더 입력해 주세요.";
  return password === confirm ? null : "비밀번호가 일치하지 않아요.";
};
