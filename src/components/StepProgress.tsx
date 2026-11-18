// src/components/StepProgress.tsx
// 회원가입 단계 바 (높이 4, 간격 5) + STEP 0N 라벨

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { TYPO } from "../constants/typography";
import { scale } from "../utils/responsive";

export default function StepProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View>
      <View
        style={styles.bars}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: step }}
      >
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={[styles.bar, index < step ? styles.barDone : styles.barTodo]}
          />
        ))}
      </View>
      <Text style={TYPO.eyebrow}>STEP {String(step).padStart(2, "0")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: "row",
    gap: scale(5),
    paddingTop: scale(1),
    paddingBottom: scale(25),
  },
  bar: { flex: 1, height: 4, borderRadius: 5 },
  barDone: { backgroundColor: COLORS.primary },
  barTodo: { backgroundColor: COLORS.progressTrack },
});
