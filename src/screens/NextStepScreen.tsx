// src/screens/NextStepScreen.tsx
// 13 다음 행동 선택

import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "../components/common/Card";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { TYPO } from "../constants/typography";
import { goHome, parseScore } from "../utils/navigation";
import { scale } from "../utils/responsive";

export default function NextStepScreen() {
  const params = useLocalSearchParams<{ before?: string; after?: string }>();
  const before = parseScore(params.before);
  const after = parseScore(params.after);

  // 한 번 더: 방금 남긴 점수를 다음 활동의 시작 점수로 이어간다.
  const findAgain = () =>
    router.replace({ pathname: "/find", params: after ? { before: String(after) } : {} });

  return (
    <ScreenLayout showBack={false}>
      <PageTitle
        eyebrow="YOUR NEXT STEP"
        title="다음은 어떻게 할까요?"
        description="원하는 활동을 선택해 주세요."
      />
      <Card>
        <Text style={TYPO.body}>내가 입력한 마음 점수</Text>
        <Text style={TYPO.bodyBold}>
          {before ?? "–"} → {after ?? "–"}
        </Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton label="한 번 더 찾아보기" onPress={findAgain} />
        <PrimaryButton
          label="활동 기록 보기"
          variant="secondary"
          onPress={() => router.replace("/records")}
        />
        <PrimaryButton label="홈으로 돌아가기" variant="secondary" onPress={goHome} />
        <PrimaryButton
          label="도움 요청하기"
          variant="secondary"
          onPress={() => router.push("/help")}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  actions: { paddingTop: scale(26), gap: scale(10) },
});
