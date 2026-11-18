// src/components/common/Chip.tsx
// 연한 블루 알약 라벨 (이번 방문의 기록, 3 / 3 찾았어요 …)

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";
import { moderateScale, scale } from "../../utils/responsive";

export default function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(20),
    backgroundColor: COLORS.primaryTint,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(11),
    lineHeight: moderateScale(17.6),
    color: COLORS.primary,
  },
});
