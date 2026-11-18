// src/screens/SignupCompleteScreen.tsx
// 06 가입 완료

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { goHome } from "../utils/navigation";
import { moderateScale, scale } from "../utils/responsive";

export default function SignupCompleteScreen() {
  return (
    <ScreenLayout
      showBack={false}
      footer={<PrimaryButton label="시작하기" onPress={goHome} />}
    >
      <View style={styles.checkArea}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
      </View>
      <PageTitle
        eyebrow="READY"
        title="함께할 준비가 됐어요"
        description="편안한 순간을 하나씩 만들어 가요."
        align="center"
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  checkArea: {
    alignItems: "center",
    paddingTop: scale(65),
    paddingBottom: scale(39),
  },
  checkCircle: {
    width: scale(128),
    height: scale(128),
    borderRadius: scale(64),
    backgroundColor: COLORS.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(56),
    lineHeight: moderateScale(89.6),
    color: COLORS.primary,
  },
});
