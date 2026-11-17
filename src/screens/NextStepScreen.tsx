// src/screens/NextStepScreen.tsx
// 13 다음 행동 선택 (API명세서 6.3 다음 행동 기록)
// - 나아졌어요(IMPROVED) / 한 번 더(RETRY) / 도움 요청(HELP)은 서버에 기록
// - 다른 모드는 서버 기록 없이 다른 mode로 숨은그림을 다시 받는다.

import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { saveNextAction } from "../api/recordApi";
import { MODE_LABEL, type NextAction } from "../api/types";
import Card from "../components/common/Card";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { TYPO } from "../constants/typography";
import { goHome, otherMode, parseMode, parseScore } from "../utils/navigation";
import { scale } from "../utils/responsive";

export default function NextStepScreen() {
  const params = useLocalSearchParams<{
    before?: string;
    after?: string;
    mode?: string;
    recordId?: string;
  }>();
  const before = parseScore(params.before);
  const after = parseScore(params.after);
  const mode = parseMode(params.mode);
  const recordId = Number(params.recordId);

  // 기록 실패는 사용자 흐름을 막지 않는다. (RECORD-001 등 무시)
  const record = (action: NextAction) => {
    if (!Number.isInteger(recordId) || recordId <= 0) return;
    saveNextAction(recordId, action).catch((error) =>
      console.warn("다음 행동 기록 실패:", error),
    );
  };

  // 한 번 더 / 다른 모드: 방금 남긴 점수를 다음 활동의 시작 점수로 이어간다.
  const findAgain = (nextMode: typeof mode) =>
    router.replace({
      pathname: "/find",
      params: { mode: nextMode, ...(after ? { before: String(after) } : {}) },
    });

  const handleRetry = () => {
    record("RETRY");
    findAgain(mode);
  };

  const handleOtherMode = () => findAgain(otherMode(mode));

  const handleImproved = () => {
    record("IMPROVED");
    goHome();
  };

  const handleHelp = () => {
    record("HELP");
    router.push("/help");
  };

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
        <PrimaryButton label="나아졌어요" onPress={handleImproved} />
        <PrimaryButton label="한 번 더 찾아보기" variant="secondary" onPress={handleRetry} />
        <PrimaryButton
          label={`${MODE_LABEL[otherMode(mode)]}로 찾아보기`}
          variant="secondary"
          onPress={handleOtherMode}
        />
        <PrimaryButton label="도움 요청하기" variant="secondary" onPress={handleHelp} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  actions: { paddingTop: scale(26), gap: scale(10) },
});
