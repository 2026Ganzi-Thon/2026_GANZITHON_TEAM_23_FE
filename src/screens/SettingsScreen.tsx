// src/screens/SettingsScreen.tsx
// 15 설정 — 알림 받기 / 효과음 (기기 로컬 저장)

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import PulseWatch from "../../modules/pulse-watch";
import { AppState, Pressable, StyleSheet, Switch, Text } from "react-native";
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

/** 개발 빌드 확인용: 워치 연결 상태 한 줄 (iOS 개발 빌드에서만) */
const watchStatusText = async () => {
  if (!__DEV__ || !PulseWatch) return null;
  const s = await PulseWatch.getStatus();
  if (!s.supported) return "워치: 이 기기에서 지원하지 않음";
  const yes = (value?: boolean) => (value ? "O" : "X");
  return `워치: 활성 ${yes(s.activated)} · 페어링 ${yes(s.paired)} · 워치 앱 ${yes(
    s.watchAppInstalled,
  )} · 즉시 연결 ${yes(s.reachable)} · 처리 대기 ${s.pendingCount ?? 0}`;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [watchStatus, setWatchStatus] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    const refresh = () => { void watchStatusText().then(text => { if (!disposed) setWatchStatus(text); }).catch(() => {}); };
    refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { disposed = true; listener.remove(); };
  }, []);

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

      <Pressable onPress={() => router.push("/my-page")} accessibilityRole="button">
        <Card>
          <Text style={TYPO.body}>내 정보 · 보호자</Text>
          <Text style={TYPO.link}>›</Text>
        </Card>
      </Pressable>

      <Pressable
        style={styles.logout}
        onPress={handleLogout}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Text style={TYPO.caption}>로그아웃</Text>
      </Pressable>

      {watchStatus && <Text style={[TYPO.caption, styles.watchStatus]}>{watchStatus}</Text>}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  logout: { alignSelf: "flex-start", paddingTop: scale(14) },
  watchStatus: { paddingTop: scale(14) },
});
