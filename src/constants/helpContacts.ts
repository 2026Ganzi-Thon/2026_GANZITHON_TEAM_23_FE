// src/constants/helpContacts.ts
// 도움 요청 연락처 (와이어프레임 메모: 109 · 1577-0199 · 119, 보호자 문자)
// 휴대폰 기본 전화 / 문자 앱으로 바로 연결한다.
// 보호자 번호는 마이페이지(API명세서 7장)에서 등록하며, HelpScreen에서 붙인다.

export interface HelpContact {
  id: string;
  label: string;
  description: string;
  url: string; // tel: / sms:
}

export const HELP_CONTACTS: HelpContact[] = [
  { id: "emergency", label: "긴급 도움", description: "119", url: "tel:119" },
  {
    id: "suicide-prevention",
    label: "자살예방 상담",
    description: "109",
    url: "tel:109",
  },
  {
    id: "mental-health",
    label: "정신건강 상담",
    description: "1577-0199",
    url: "tel:15770199",
  },
];

/** 01012345678 → 010-1234-5678 */
export const formatPhone = (phone: string) =>
  phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
