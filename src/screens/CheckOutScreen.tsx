// src/screens/CheckOutScreen.tsx
// 12 활동 후 상태 → 기록하기 (API명세서 6.2 활동 기록 저장)

import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { createRecord } from "../api/recordApi";
import type { MoodScore } from "../api/types";
import PrimaryButton from "../components/common/PrimaryButton";
import MoodScale from "../components/MoodScale";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { parseMode, parseParam, parseScore } from "../utils/navigation";

export default function CheckOutScreen() {
  const params = useLocalSearchParams<{
    alertId?: string;
    before?: string;
    pictureId?: string;
    mode?: string;
  }>();
  const [score, setScore] = useState<MoodScore | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!score || saving) return;
    const before = parseScore(params.before);
    const mode = parseMode(params.mode);
    let recordId: number | null = null;

    setSaving(true);
    try {
      const record = await createRecord({
        mode,
        pictureId: parseParam(params.pictureId),
        alertId: parseParam(params.alertId),
        beforeScore: before,
        afterScore: score,
      });
      recordId = record.recordId;
    } catch (error) {
      // 기록 저장에 실패해도 사용자의 흐름은 끊지 않는다.
      console.warn("활동 기록 저장 실패:", error);
    } finally {
      setSaving(false);
    }

    router.replace({
      pathname: "/next-step",
      params: {
        mode,
        after: String(score),
        ...(before ? { before: String(before) } : {}),
        ...(recordId !== null ? { recordId: String(recordId) } : {}),
      },
    });
  };

  return (
    <ScreenLayout
      footer={
        <PrimaryButton label="기록하기" onPress={handleSave} disabled={!score} loading={saving} />
      }
    >
      <PageTitle
        eyebrow="CHECK OUT"
        title={"지금의 마음을\n다시 살펴볼까요?"}
        description="가장 가까운 숫자를 선택해 주세요."
      />
      <MoodScale value={score} onChange={setScore} />
    </ScreenLayout>
  );
}
