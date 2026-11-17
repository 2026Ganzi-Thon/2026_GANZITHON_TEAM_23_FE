// src/screens/HelpScreen.tsx
// 16 도움 요청 — 휴대폰 기본 전화 / 문자 앱으로 바로 연결

import * as Linking from "expo-linking";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../components/common/Card";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { HELP_CONTACTS, HelpContact } from "../constants/helpContacts";
import { TYPO } from "../constants/typography";
import { goHome } from "../utils/navigation";
import { moderateScale, scale } from "../utils/responsive";

const connect = async (contact: HelpContact) => {
  try {
    await Linking.openURL(contact.url);
  } catch {
    Alert.alert("연결하지 못했어요", `${contact.label} (${contact.description})로 직접 연락해 주세요.`);
  }
};

export default function HelpScreen() {
  return (
    <ScreenLayout
      hideHelp
      footer={<PrimaryButton label="홈으로" variant="secondary" onPress={goHome} />}
    >
      <PageTitle
        eyebrow="SUPPORT"
        title="도움이 필요할 때"
        description="연결할 대상을 선택할 수 있어요."
      />

      {HELP_CONTACTS.map((contact) => (
        <Card key={contact.id}>
          <View>
            <Text style={TYPO.bodyBold}>{contact.label}</Text>
            <Text style={TYPO.small}>{contact.description}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.connect, pressed && styles.pressed]}
            onPress={() => connect(contact)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${contact.label} 연결`}
          >
            <Text style={styles.connectLabel}>연결</Text>
          </Pressable>
        </Card>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  connect: {
    paddingHorizontal: scale(12),
    paddingTop: scale(5),
    paddingBottom: scale(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(20),
    backgroundColor: COLORS.surface,
  },
  pressed: { opacity: 0.7 },
  connectLabel: {
    fontFamily: FONTS.regular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(19.2),
    color: COLORS.primary,
    textAlign: "center",
  },
});
