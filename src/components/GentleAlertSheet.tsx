// src/components/GentleAlertSheet.tsx
// 08 부담 없는 알림 — 앱 안 바텀시트로 "잠깐 같이 쉬어갈까요?"를 묻는다.
// 심박 수치는 보여주지 않는다.

import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { MOBILE_MAX_WIDTH, scale } from "../utils/responsive";
import PrimaryButton from "./common/PrimaryButton";
import PageTitle from "./PageTitle";

interface GentleAlertSheetProps {
  visible: boolean;
  onStart: () => void; // 바로 시작
  onDecline: () => void; // 괜찮아요
  onClose: () => void; // 바깥 영역 / 뒤로가기로 닫기
}

export default function GentleAlertSheet({
  visible,
  onStart,
  onDecline,
  onClose,
}: GentleAlertSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="알림 닫기"
        />
        <View style={[styles.sheet, { paddingBottom: scale(30) + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.text}>
            <PageTitle
              eyebrow="A GENTLE CHECK"
              title="잠깐 같이 쉬어갈까요?"
              description="지금 상태를 확인해 보세요."
              align="center"
            />
          </View>
          <PrimaryButton label="바로 시작" onPress={onStart} />
          <PrimaryButton label="괜찮아요" variant="secondary" onPress={onDecline} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.dim,
  },
  sheet: {
    width: "100%",
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: "center",
    alignItems: "center",
    gap: scale(10),
    paddingHorizontal: scale(26),
    paddingTop: scale(30),
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    backgroundColor: COLORS.surface,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: COLORS.handle,
  },
  text: { width: "100%", paddingTop: scale(18) },
});
