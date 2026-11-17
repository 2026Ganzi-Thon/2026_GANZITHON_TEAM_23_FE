// src/components/ScreenLayout.tsx
// 화면 공통 틀: 헤더 + 본문(좌우 26, 위 19) + 하단 버튼 영역(아래 32)
// 본문이 짧으면 하단 버튼이 화면 아래에 붙고, 길면 함께 스크롤된다.

import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { MOBILE_MAX_WIDTH, scale } from "../utils/responsive";
import AppHeader from "./AppHeader";

interface ScreenLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  hideHelp?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function ScreenLayout({
  children,
  footer,
  showBack,
  onBack,
  hideHelp,
  contentStyle,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <AppHeader showBack={showBack} onBack={onBack} hideHelp={hideHelp} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
            {footer && (
              <>
                <View style={styles.spacer} />
                <View style={styles.footer}>{footer}</View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  mobileWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: "center",
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: scale(26),
    paddingTop: scale(19),
    paddingBottom: scale(32),
  },
  spacer: { flexGrow: 1, minHeight: scale(30) },
  footer: { width: "100%", gap: scale(10) },
});
