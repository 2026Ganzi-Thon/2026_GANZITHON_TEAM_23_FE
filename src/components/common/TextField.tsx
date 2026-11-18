// src/components/common/TextField.tsx
// 라벨 + 입력창 + 오류 문구
// - 입력창: 흰 배경, 테두리 #DBE5EC, radius 12 (오류 시 테두리 #B44C55)
// - 오류 문구 자리를 항상 확보해 오류가 떠도 아래 입력창이 밀리지 않는다.

import React, { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";
import { TYPO } from "../../constants/typography";
import { moderateScale, scale } from "../../utils/responsive";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, error, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.container}>
      <Text style={TYPO.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={COLORS.placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={label}
        {...inputProps}
      />
      <Text style={styles.error} accessibilityLiveRegion="polite">
        {error ?? ""}
      </Text>
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: scale(21),
    gap: scale(6),
  },
  input: {
    width: "100%",
    height: scale(56),
    paddingHorizontal: scale(15),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(12),
    backgroundColor: COLORS.surface,
    fontFamily: FONTS.regular,
    fontSize: moderateScale(15),
    color: COLORS.textMain,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
  inputError: { borderColor: COLORS.error },
  error: {
    minHeight: scale(22),
    fontFamily: FONTS.regular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(19.2),
    color: COLORS.error,
  },
});
