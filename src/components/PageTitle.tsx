// src/components/PageTitle.tsx
// 영문 라벨 + 제목 + 설명 (대부분의 화면 상단)

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TYPO } from "../constants/typography";
import { scale } from "../utils/responsive";

interface PageTitleProps {
  eyebrow?: string; // 회원가입 화면은 StepProgress가 대신 표시
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function PageTitle({ eyebrow, title, description, align = "left" }: PageTitleProps) {
  const textAlign = { textAlign: align } as const;
  return (
    <View>
      {eyebrow && <Text style={[TYPO.eyebrow, textAlign]}>{eyebrow}</Text>}
      <Text style={[TYPO.title, textAlign, styles.title]} accessibilityRole="header">
        {title}
      </Text>
      {description && (
        <Text style={[TYPO.description, textAlign, styles.description]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: scale(8), paddingBottom: scale(12) },
  description: { paddingBottom: scale(20) },
});
