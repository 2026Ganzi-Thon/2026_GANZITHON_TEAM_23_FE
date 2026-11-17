// src/screens/HelpScreen.tsx
// 16 도움 요청 — 휴대폰 기본 전화 / 문자 앱으로 바로 연결
// 보호자에게 문자: 마이페이지에 등록한 보호자 번호로 문자 앱을 연다. (없으면 등록 화면으로)

import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { Guardian } from "../api/types";
import { getMe } from "../api/userApi";
import Card from "../components/common/Card";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { formatPhone, HELP_CONTACTS } from "../constants/helpContacts";
import { TYPO } from "../constants/typography";
import { getAccessToken } from "../utils/authStorage";
import { goHome } from "../utils/navigation";
import { moderateScale, scale } from "../utils/responsive";

const openUrl = async (url: string, fallback: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("연결하지 못했어요", fallback);
  }
};

export default function HelpScreen() {
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // 마이페이지에서 보호자를 등록하고 돌아오면 다시 불러온다.
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      getAccessToken().then((token) => {
        if (ignore) return;
        setLoggedIn(!!token);
        if (!token) return;
        getMe()
          .then((me) => !ignore && setGuardian(me.guardian))
          .catch((error) => console.warn("보호자 정보 불러오기 실패:", error));
      });
      return () => {
        ignore = true;
      };
    }, []),
  );

  const handleGuardian = () => {
    if (guardian) {
      void openUrl(`sms:${guardian.phone}`, `${guardian.name}(${formatPhone(guardian.phone)})에게 직접 연락해 주세요.`);
    } else if (loggedIn) {
      router.push("/my-page");
    } else {
      void openUrl("sms:", "문자 앱을 열지 못했어요.");
    }
  };

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
        <ContactCard
          key={contact.id}
          label={contact.label}
          description={contact.description}
          action="연결"
          onPress={() =>
            openUrl(contact.url, `${contact.label} (${contact.description})로 직접 연락해 주세요.`)
          }
        />
      ))}

      <ContactCard
        label="보호자에게 문자"
        description={
          guardian
            ? `${guardian.name} · ${formatPhone(guardian.phone)}`
            : loggedIn
              ? "보호자를 등록해 주세요"
              : "문자 앱 열기"
        }
        action={guardian || !loggedIn ? "연결" : "등록"}
        onPress={handleGuardian}
      />
    </ScreenLayout>
  );
}

function ContactCard({
  label,
  description,
  action,
  onPress,
}: {
  label: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Card>
      <View style={styles.text}>
        <Text style={TYPO.bodyBold}>{label}</Text>
        <Text style={TYPO.small}>{description}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.connect, pressed && styles.pressed]}
        onPress={onPress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${action}`}
      >
        <Text style={styles.connectLabel}>{action}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  text: { flexShrink: 1, paddingRight: scale(12) },
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
