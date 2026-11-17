// src/screens/RestScreen.tsx
// 11 잠시 쉬어가기 — 원이 천천히 커졌다 작아지며 호흡을 돕는다.

import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native";
import BreathingCircle from "../components/BreathingCircle";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { TYPO } from "../constants/typography";
import { scale } from "../utils/responsive";

export default function RestScreen() {
  const params = useLocalSearchParams<{ alertId?: string; before?: string; pictureId?: string }>();

  return (
    <ScreenLayout
      footer={
        <>
          <PrimaryButton
            label="현재 마음 확인하기"
            onPress={() => router.push({ pathname: "/check-out", params })}
          />
          <PrimaryButton label="그림으로 돌아가기" variant="secondary" onPress={() => router.back()} />
        </>
      }
    >
      <PageTitle
        eyebrow="TAKE A MOMENT"
        title={"이제 잠시 멈추고\n여유를 가져 보세요"}
        description="준비되면 다음 화면으로 넘어가요."
      />
      <BreathingCircle breathing />
      <Text style={[TYPO.description, styles.caption]}>나에게 필요한 만큼 천천히.</Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  caption: { textAlign: "center", paddingBottom: scale(20) },
});
