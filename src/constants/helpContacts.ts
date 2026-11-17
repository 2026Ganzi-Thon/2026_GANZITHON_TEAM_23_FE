// src/constants/helpContacts.ts
// 도움 요청 연락처 (와이어프레임 메모: 109 · 1577-0199 · 119, 보호자 문자)
// 휴대폰 기본 전화 / 문자 앱으로 바로 연결한다.

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
  // TODO: 보호자 번호 등록 기능이 생기면 sms:<번호> 로 연결
  {
    id: "guardian",
    label: "보호자에게 문자",
    description: "문자 앱 열기",
    url: "sms:",
  },
];
