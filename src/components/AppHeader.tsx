// src/components/AppHeader.tsx
// 공통 상단 헤더 (높이 65, 좌우 24)
// ← 뒤로가기 | 잠깐의 쉼 | 도움 요청
// 도움 요청은 모든 화면 상단에 고정한다. (와이어프레임 메모)

import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { moderateScale, scale } from "../utils/responsive";

interface AppHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  hideHelp?: boolean; // 도움 요청 화면 자신에서는 숨김
}

export default function AppHeader({ showBack = true, onBack, hideHelp = false }: AppHeaderProps) {
  const canGoBack = showBack && (onBack !== undefined || router.canGoBack());

  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {canGoBack && (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
          >
            <Text style={styles.back}>←</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.title}>잠깐의 쉼</Text>

      <View style={[styles.side, styles.sideRight]}>
        {!hideHelp && (
          <Pressable
            style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
            onPress={() => router.push("/help")}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text style={styles.helpLabel}>도움 요청</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: scale(65),
    paddingHorizontal: scale(24),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: { flex: 1, alignItems: "flex-start" },
  sideRight: { alignItems: "flex-end" },
  back: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(24),
    color: COLORS.textMain,
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20.8),
    color: COLORS.textMain,
  },
  helpButton: {
    paddingHorizontal: scale(12),
    paddingTop: scale(5),
    paddingBottom: scale(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(20),
    backgroundColor: COLORS.surface,
  },
  pressed: { opacity: 0.7 },
  helpLabel: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(19.2),
    color: COLORS.primary,
  },
});
