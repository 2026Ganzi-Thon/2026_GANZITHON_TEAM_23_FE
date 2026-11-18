// src/components/common/PrimaryButton.tsx
// 기본 CTA 버튼 (padding 15, radius 14, 15px SemiBold)
// - primary: 블루 배경 + 흰 글자
// - secondary: 연한 블루 배경 + 블루 글자

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";
import { moderateScale, scale } from "../../utils/responsive";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const isPrimary = variant === "primary";
  const inactive = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.surface : COLORS.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: scale(54),
    padding: scale(15),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.primaryTint },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(24),
    textAlign: "center",
  },
  primaryLabel: { color: COLORS.surface },
  secondaryLabel: { color: COLORS.primary },
});
