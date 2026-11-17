// src/utils/responsive.ts
import { Dimensions, Platform } from "react-native";

// 피그마 디자인 기준 규격 (390 x 844)
const FIGMA_BASE_WIDTH = 390;
const FIGMA_BASE_HEIGHT = 844;

// 웹에서는 모바일 폭(최대 390px)으로 보정
const { width: rawWidth, height: rawHeight } = Dimensions.get("window");
const screenWidth =
  Platform.OS === "web" ? Math.min(rawWidth, FIGMA_BASE_WIDTH) : rawWidth;

export const MOBILE_MAX_WIDTH = FIGMA_BASE_WIDTH;

/** 가로 비율 기준 스케일 (너비, 좌우 여백 등) */
export const scale = (size: number): number =>
  (screenWidth / FIGMA_BASE_WIDTH) * size;

/** 세로 비율 기준 스케일 (큰 상하 여백) */
export const verticalScale = (size: number): number =>
  (rawHeight / FIGMA_BASE_HEIGHT) * size;

/** 폰트 / 아이콘 크기 완충 스케일 (변화 폭을 절반으로) */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;
