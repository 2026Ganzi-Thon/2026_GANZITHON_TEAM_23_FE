// src/screens/RecordsScreen.tsx
// 14 활동 기록 (빈 상태) / 22 활동 기록 예시

import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityRecord, getRecords } from "../api/recordApi";
import { MODE_LABEL } from "../api/types";
import Card from "../components/common/Card";
import Chip from "../components/common/Chip";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { TYPO } from "../constants/typography";
import { formatRecordDate } from "../utils/date";
import { scale } from "../utils/responsive";

export default function RecordsScreen() {
  const [records, setRecords] = useState<ActivityRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // 기록을 남기고 돌아올 때마다 새로 불러온다.
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      setLoadError(false);
      getRecords()
        .then((data) => !ignore && setRecords(data))
        .catch((error) => {
          console.warn("활동 기록 불러오기 실패:", error);
          if (!ignore) setLoadError(true);
        });
      return () => {
        ignore = true;
      };
    }, []),
  );

  return (
    <ScreenLayout
      footer={<PrimaryButton label="활동 시작하기" onPress={() => router.push("/check-in")} />}
    >
      <PageTitle
        eyebrow="MY ACTIVITY"
        title="활동 기록"
        description="내가 남긴 순간들을 살펴봐요."
      />

      <View style={styles.toolbar}>
        <Chip label="이번 방문의 기록" />
        <Pressable onPress={() => router.push("/settings")} hitSlop={8} accessibilityRole="button">
          <Text style={TYPO.link}>설정</Text>
        </Pressable>
      </View>

      {records === null && !loadError ? (
        <ActivityIndicator style={styles.loading} color={COLORS.primary} />
      ) : records && records.length > 0 ? (
        records.map((record) => (
          <Card key={record.recordId}>
            <View style={styles.recordText}>
              <Text style={TYPO.bodyBold}>{record.activityName}</Text>
              <Text style={TYPO.description}>
                {MODE_LABEL[record.mode]} · {formatRecordDate(record.createdAt)}
              </Text>
            </View>
            <Text style={TYPO.bodyBold}>
              {record.beforeScore ?? "–"} → {record.afterScore}
            </Text>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={[TYPO.body, styles.center]}>
            {loadError ? "기록을 불러오지 못했어요." : "아직 남긴 기록이 없어요."}
          </Text>
          <Text style={[TYPO.description, styles.center]}>
            {loadError ? "잠시 후 다시 확인해 주세요." : "활동 후 마음 점수를 남겨보세요."}
          </Text>
        </Card>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loading: { paddingVertical: scale(60) },
  recordText: { gap: 1 },
  emptyCard: {
    flexDirection: "column",
    justifyContent: "center",
    gap: scale(20),
    paddingVertical: scale(60),
    paddingHorizontal: scale(15),
  },
  center: { textAlign: "center" },
});
