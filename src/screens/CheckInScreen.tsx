// src/screens/CheckInScreen.tsx
// 09 활동 전 상태 — 선택하지 않고 시작해도 된다. (시작 전 입력은 건너뛸 수 있음)

import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import type { MoodScore } from "../api/types";
import PrimaryButton from "../components/common/PrimaryButton";
import MoodScale from "../components/MoodScale";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";

export default function CheckInScreen() {
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();
  const [score, setScore] = useState<MoodScore | null>(null);

  const handleStart = () => {
    router.push({
      pathname: "/find",
      params: {
        ...(alertId ? { alertId } : {}),
        ...(score ? { before: String(score) } : {}),
      },
    });
  };

  return (
    <ScreenLayout footer={<PrimaryButton label="그림 찾기 시작" onPress={handleStart} />}>
      <PageTitle
        eyebrow="CHECK IN"
        title={"지금 마음은\n어느 정도인가요?"}
        description="가장 가까운 숫자를 선택해 주세요."
      />
      <MoodScale value={score} onChange={setScore} />
    </ScreenLayout>
  );
}
