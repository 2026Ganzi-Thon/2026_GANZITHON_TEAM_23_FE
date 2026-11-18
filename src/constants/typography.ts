// src/constants/typography.ts
// 피그마 텍스트 스타일 (크기 / 행간 / 자간)

import { StyleSheet } from "react-native";
import { moderateScale as ms } from "../utils/responsive";
import { COLORS } from "./colors";
import { FONTS } from "./fonts";

export const TYPO = StyleSheet.create({
  // 화면 상단 영문 라벨 (WELCOME BACK, STEP 01 …)
  eyebrow: {
    fontFamily: FONTS.bold,
    fontSize: ms(11),
    lineHeight: ms(17.6),
    letterSpacing: 2,
    color: COLORS.primary,
  },
  // 화면 제목
  title: {
    fontFamily: FONTS.bold,
    fontSize: ms(28),
    lineHeight: ms(39.2),
    letterSpacing: -1,
    color: COLORS.textMain,
  },
  // 제목 아래 설명
  description: {
    fontFamily: FONTS.regular,
    fontSize: ms(14),
    lineHeight: ms(22.4),
    color: COLORS.textSub,
  },
  // 카드 / 목록 본문
  body: {
    fontFamily: FONTS.regular,
    fontSize: ms(15),
    lineHeight: ms(24),
    color: COLORS.textMain,
  },
  bodyBold: {
    fontFamily: FONTS.bold,
    fontSize: ms(15),
    lineHeight: ms(24),
    color: COLORS.textMain,
  },
  // 입력 라벨
  label: {
    fontFamily: FONTS.semibold,
    fontSize: ms(13),
    lineHeight: ms(20.8),
    color: COLORS.textMain,
  },
  // 작은 보조 문구
  small: {
    fontFamily: FONTS.regular,
    fontSize: ms(12),
    lineHeight: ms(19.2),
    color: COLORS.textSub,
  },
  // 하단 안내 문구
  caption: {
    fontFamily: FONTS.regular,
    fontSize: ms(11),
    lineHeight: ms(17.6),
    color: COLORS.textCaption,
  },
  // 텍스트 버튼 (설정, 잠시 쉬기)
  link: {
    fontFamily: FONTS.regular,
    fontSize: ms(15),
    lineHeight: ms(24),
    color: COLORS.primary,
  },
});
