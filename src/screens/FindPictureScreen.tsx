// src/screens/FindPictureScreen.tsx
// 10 숨은그림찾기 / 21 숨은그림찾기 완료
// 서버에서 그림과 찾을 사물 목록을 받아와 띄운다. 시간제한 없음.

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getPicture, Picture } from "../api/pictureApi";
import Chip from "../components/common/Chip";
import PrimaryButton from "../components/common/PrimaryButton";
import HiddenPictureBoard from "../components/HiddenPictureBoard";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { TYPO } from "../constants/typography";
import { withObjectParticle } from "../utils/korean";
import { scale } from "../utils/responsive";

export default function FindPictureScreen() {
  const params = useLocalSearchParams<{ alertId?: string; before?: string }>();
  const [picture, setPicture] = useState<Picture | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getPicture(params.alertId)
      .then((data) => {
        if (ignore) return;
        setPicture(data);
        setFoundIds([]);
      })
      .catch((error) => {
        console.warn("그림 불러오기 실패:", error);
        if (!ignore) setLoadError(true);
      });
    return () => {
      ignore = true;
    };
  }, [params.alertId, reloadKey]);

  const reload = () => {
    setLoadError(false);
    setReloadKey((key) => key + 1);
  };

  const total = picture?.targets.length ?? 0;
  const allFound = total > 0 && foundIds.length === total;

  const goRest = () =>
    router.push({
      pathname: "/rest",
      params: {
        ...params,
        ...(picture ? { pictureId: picture.pictureId } : {}),
      },
    });

  // 같은 사물이 여러 개면 한 번만 (고양이 x3 → "고양이를")
  const labels = picture ? [...new Set(picture.targets.map((target) => target.label))] : [];
  const description = picture
    ? `${labels
        .map((label, index) => (index === labels.length - 1 ? withObjectParticle(label) : label))
        .join(", ")} 하나씩 찾아주세요.`
    : "그림을 준비하고 있어요.";

  return (
    <ScreenLayout
      footer={
        <PrimaryButton label="다 찾았어요 · 계속하기" onPress={goRest} disabled={!allFound} />
      }
    >
      <PageTitle eyebrow="FIND YOUR FOCUS" title="그림을 천천히 살펴봐요" description={description} />

      <View style={styles.statusRow}>
        <Chip label={`${foundIds.length} / ${total} 찾았어요`} />
        <Pressable onPress={goRest} hitSlop={8} accessibilityRole="button">
          <Text style={TYPO.link}>잠시 쉬기</Text>
        </Pressable>
      </View>

      <View style={styles.boardArea}>
        {picture ? (
          <HiddenPictureBoard
            picture={picture}
            foundIds={foundIds}
            onFind={(id) => setFoundIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          />
        ) : (
          <View style={styles.placeholder}>
            {loadError ? (
              <>
                <Text style={TYPO.description}>그림을 불러오지 못했어요.</Text>
                <Pressable onPress={reload} hitSlop={8} accessibilityRole="button">
                  <Text style={TYPO.link}>다시 불러오기</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color={COLORS.primary} />
            )}
          </View>
        )}
      </View>

      <Text style={[TYPO.small, styles.hint]}>시간제한 없이, 편한 속도로 찾아보세요.</Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  boardArea: { paddingVertical: scale(16) },
  placeholder: {
    width: "100%",
    aspectRatio: 338 / 420,
    borderRadius: scale(22),
    backgroundColor: COLORS.sceneBg,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  hint: { textAlign: "center" },
});
