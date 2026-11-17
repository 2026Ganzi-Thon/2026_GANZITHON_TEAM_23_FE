// src/screens/SplashScreen.tsx
// 01 스플래시 — 로그인 전 첫 화면

import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import BreathingCircle from "../components/BreathingCircle";
import PrimaryButton from "../components/common/PrimaryButton";
import ScreenLayout from "../components/ScreenLayout";
import { TYPO } from "../constants/typography";
import { scale, verticalScale } from "../utils/responsive";

export default function SplashScreen() {
  return (
    <ScreenLayout
      showBack={false}
      footer={<PrimaryButton label="시작하기" onPress={() => router.push("/login")} />}
    >
      <View style={styles.hero}>
        <BreathingCircle label="잠깐의 쉼" />
        <Text style={[TYPO.title, styles.center]} accessibilityRole="header">
          지금, 여기의 나에게
        </Text>
        <Text style={[TYPO.description, styles.center]}>눈앞의 작은 것부터 천천히.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: verticalScale(80),
    gap: scale(12),
  },
  center: { textAlign: "center" },
});
