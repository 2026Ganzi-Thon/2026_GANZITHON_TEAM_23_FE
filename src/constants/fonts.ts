// src/constants/fonts.ts
// Noto Sans KR (피그마 사용 폰트)
// 커스텀 폰트는 fontWeight로 굵기가 바뀌지 않으므로 굵기별 fontFamily를 지정한다.

import {
  NotoSansKR_300Light,
  NotoSansKR_400Regular,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
} from "@expo-google-fonts/noto-sans-kr";

// _layout.tsx의 useFonts에 그대로 전달
export const FONT_ASSETS = {
  NotoSansKR_300Light,
  NotoSansKR_400Regular,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
};

export const FONTS = {
  light: "NotoSansKR_300Light",
  regular: "NotoSansKR_400Regular",
  semibold: "NotoSansKR_600SemiBold",
  bold: "NotoSansKR_700Bold",
} as const;
