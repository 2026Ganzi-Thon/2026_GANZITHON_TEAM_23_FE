// src/screens/SettingsScreen.tsx
// 15 설정 — 알림 받기 / 효과음 (기기 로컬 저장)

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import Card from "../components/common/Card";
import PrimaryButton from "../components/common/PrimaryButton";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { TYPO } from "../constants/typography";
import { clearAccessToken } from "../utils/authStorage";
import { goHome } from "../utils/navigation";
import { scale } from "../utils/responsive";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
} from "../utils/settingsStorage";

const OPTIONS: { key: keyof AppSettings; label: string }[] = [
  { key: "alertsEnabled", label: "알림 받기" },
  { key: "soundEnabled", label: "효과음" },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const toggle = (key: keyof AppSettings) => (value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    void saveSettings(next);
  };

  const handleLogout = async () => {
    await clearAccessToken();
    goHome();
  };

  return (
    <ScreenLayout
      footer={
        <PrimaryButton
          label="활동 기록으로"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/records"))}
        />
      }
    >
      <PageTitle
        eyebrow="PREFERENCES"
        title="설정"
        description="나에게 편한 환경을 만들어 보세요."
      />

      {OPTIONS.map(({ key, label }) => (
        <Card key={key}>
          <Text style={TYPO.body}>{label}</Text>
          <Switch
            value={settings[key]}
            onValueChange={toggle(key)}
            trackColor={{ true: COLORS.primary, false: COLORS.border }}
            thumbColor={COLORS.surface}
            ios_backgroundColor={COLORS.border}
            accessibilityLabel={label}
          />
        </Card>
      ))}

      <Pressable
        style={styles.logout}
        onPress={handleLogout}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text style={TYPO.caption}>로그아웃</Text>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  logout: { alignSelf: "flex-start", paddingTop: scale(14) },
});
