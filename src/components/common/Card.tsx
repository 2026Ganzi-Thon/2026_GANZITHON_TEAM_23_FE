// src/components/common/Card.tsx
// 흰 카드 (테두리 #DBE5EC, radius 16, padding 18) — 기본은 좌우 정렬 한 줄

import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/colors";
import { scale } from "../../utils/responsive";

export default function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginVertical: scale(10),
    padding: scale(18),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(16),
    backgroundColor: COLORS.surface,
  },
});
