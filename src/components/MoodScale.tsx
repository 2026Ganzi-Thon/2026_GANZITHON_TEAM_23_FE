// src/components/MoodScale.tsx
// 마음 점수 선택 (09 활동 전 / 12 활동 후)
// 큰 숫자(80 Light) + 1~5 원형 버튼(48) + 양 끝 안내

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MoodScore } from "../api/types";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { TYPO } from "../constants/typography";
import { moderateScale, scale } from "../utils/responsive";

const SCORES: MoodScore[] = [1, 2, 3, 4, 5];

interface MoodScaleProps {
  value: MoodScore | null;
  onChange: (score: MoodScore) => void;
}

export default function MoodScale({ value, onChange }: MoodScaleProps) {
  return (
    <View>
      <Text style={[styles.bigNumber, value === null && styles.bigNumberEmpty]}>
        {value ?? "–"}
      </Text>

      <View style={styles.buttons} accessibilityRole="radiogroup">
        {SCORES.map((score) => {
          const selected = score === value;
          return (
            <Pressable
              key={score}
              style={[styles.button, selected && styles.buttonSelected]}
              onPress={() => onChange(score)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${score}점`}
            >
              <Text style={[styles.buttonLabel, selected && styles.buttonLabelSelected]}>
                {score}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={TYPO.small}>편안해요</Text>
        <Text style={TYPO.small}>많이 불안해요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bigNumber: {
    paddingTop: scale(50),
    paddingBottom: scale(12),
    fontFamily: FONTS.light,
    fontSize: moderateScale(80),
    lineHeight: moderateScale(128),
    color: COLORS.primary,
    textAlign: "center",
  },
  bigNumberEmpty: { color: COLORS.border },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(8),
  },
  button: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  buttonLabel: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(24),
    color: COLORS.textSub,
  },
  buttonLabelSelected: { color: COLORS.surface },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: scale(12),
  },
});
