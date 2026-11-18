// src/screens/HomeScreen.tsx
// 07 홈 (모의 생체 신호 감지)
// - 알림이 없어도 큰 원 / 바로 시작 한 번으로 활동을 시작할 수 있다.
// - 모의 알림 확인하기: 모의 심박을 재생해 실제와 같은 흐름(감지 → 서버 → 알림)으로 08 알림을 띄운다.

import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import BreathingCircle from "../components/BreathingCircle";
import Chip from "../components/common/Chip";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { useHeartRateAlert } from "../providers/HeartRateAlertProvider";
import { scale } from "../utils/responsive";

export default function HomeScreen() {
  const { runMockScenario } = useHeartRateAlert();
  const startActivity = () => router.push("/check-in");

  return (
    <ScreenLayout
      showBack={false}
      footer={
        <>
          <PrimaryButton label="바로 시작" onPress={startActivity} />
          <PrimaryButton label="모의 알림 확인하기" variant="secondary" onPress={runMockScenario} />
          <PrimaryButton
            label="활동 기록"
            variant="secondary"
            onPress={() => router.push("/records")}
          />
        </>
      }
    >
      <PageTitle
        eyebrow="YOUR MOMENT"
        title={"불안한 순간,\n지금 여기로 돌아와요"}
        description="필요할 때, 그림 속 작은 사물을 찾아보세요."
      />
      <BreathingCircle label="지금 시작" onPress={startActivity} />
      <View style={styles.chipRow}>
        <Chip label="모의 생체 신호 · 시연용" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  chipRow: { alignItems: "center", paddingTop: scale(3) },
});
