// src/constants/colors.ts
// 피그마 design 섹션 기준 색상

export const COLORS = {
  primary: "#39739B", // 메인 블루 (버튼, 강조 텍스트)
  primaryTint: "#EDF4F8", // 보조 버튼 / 칩 배경
  textMain: "#243746", // 본문 / 제목
  textSub: "#778895", // 설명 문구
  textCaption: "#8595A2", // 하단 안내 문구
  placeholder: "#757575", // 입력창 플레이스홀더
  border: "#DBE5EC", // 카드 / 입력창 테두리
  progressTrack: "#E3EBF1", // 회원가입 단계 바 (미완료)
  handle: "#D4DFE6", // 바텀시트 손잡이
  error: "#B44C55", // 입력 오류
  background: "#FCFDFF", // 화면 배경
  surface: "#FFFFFF", // 카드 / 입력창 배경
  sceneBg: "#E6EEDF", // 숨은그림 카드 배경
  dim: "rgba(36, 55, 70, 0.33)", // 바텀시트 배경 딤
  markerBg: "rgba(255, 255, 255, 0.6)", // 찾은 사물 표시 배경

  // 호흡 원 (안쪽 → 바깥쪽)
  ripple: ["#39739B", "#8EB5D0", "#CFDFEB", "#EDF4F8", "#F4F8FB"],
} as const;
