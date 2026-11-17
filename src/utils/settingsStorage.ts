// src/utils/settingsStorage.ts
// 기기 로컬 설정 (15 설정 화면)

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppSettings {
  alertsEnabled: boolean; // 알림 받기 (끄면 심박 급상승 알림을 띄우지 않음)
  soundEnabled: boolean; // 효과음
}

const KEY_SETTINGS = "app.settings";

export const DEFAULT_SETTINGS: AppSettings = {
  alertsEnabled: true,
  soundEnabled: true,
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await AsyncStorage.getItem(KEY_SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  try {
    await AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // 저장 실패 시 다음 실행 때 기본값으로 돌아갈 뿐이므로 무시
  }
};
