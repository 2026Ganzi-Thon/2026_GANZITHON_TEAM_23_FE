// src/utils/authStorage.ts
// 로그인 토큰 저장
// - iOS / Android: expo-secure-store (기기 보안 저장소)
// - 웹: secure-store를 지원하지 않으므로 AsyncStorage(localStorage)로 대체

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY_ACCESS_TOKEN = "auth.accessToken";

const isWeb = Platform.OS === "web";

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return isWeb
      ? await AsyncStorage.getItem(KEY_ACCESS_TOKEN)
      : await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
  } catch {
    return null;
  }
};

export const saveAccessToken = async (token: string) => {
  if (isWeb) {
    await AsyncStorage.setItem(KEY_ACCESS_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, token);
  }
};

export const clearAccessToken = async () => {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(KEY_ACCESS_TOKEN);
    } else {
      await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
    }
  } catch {
    // 이미 없으면 무시
  }
};
