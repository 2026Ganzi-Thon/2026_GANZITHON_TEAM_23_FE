// src/components/BreathingCircle.tsx
// 동심원 (지름 210 + 바깥 14 링)
// 피그마의 방사형 그라디언트 단계를 원 5개로 그린다.
//   지름 238 #F4F8FB / 210 #EDF4F8 / 176 #CFDFEB / 131 #8EB5D0 / 87 #39739B
// breathing이면 천천히 커졌다 작아진다. (11 잠시 쉬어가기)

import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { moderateScale, scale } from "../utils/responsive";

const [CORE, INNER, MIDDLE, OUTER, HALO] = COLORS.ripple;

// 바깥 → 안쪽 (지름, 색)
const RINGS: [number, string][] = [
  [238, HALO],
  [210, OUTER],
  [176, MIDDLE],
  [131, INNER],
  [87, CORE],
];

interface BreathingCircleProps {
  label?: string;
  onPress?: () => void;
  breathing?: boolean;
}

export default function BreathingCircle({ label, onPress, breathing = false }: BreathingCircleProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!breathing) return;
    // 들숨 4초 · 날숨 4초
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathing, progress]);

  const scaleAnim = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.04] });

  const circles = (
    <Animated.View style={[styles.stack, breathing && { transform: [{ scale: scaleAnim }] }]}>
      {RINGS.map(([size, color]) => (
        <View
          key={size}
          style={[
            styles.ring,
            {
              width: scale(size),
              height: scale(size),
              borderRadius: scale(size) / 2,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      {label && <Text style={styles.label}>{label}</Text>}
    </Animated.View>
  );

  return (
    <View style={styles.area}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {circles}
        </Pressable>
      ) : (
        circles
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    height: scale(290),
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    width: scale(238),
    height: scale(238),
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { position: "absolute" },
  label: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(25.6),
    color: COLORS.surface,
    textAlign: "center",
  },
  pressed: { opacity: 0.85 },
});
