import { useFonts } from "@expo-google-fonts/noto-sans-kr";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { COLORS } from "../constants/colors";
import { FONT_ASSETS } from "../constants/fonts";
import { HeartRateAlertProvider } from "../providers/HeartRateAlertProvider";

// 폰트를 불러올 때까지 네이티브 스플래시 유지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <HeartRateAlertProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // 화면마다 AppHeader를 직접 그림
          animation: "fade",
          contentStyle: { backgroundColor: COLORS.background },
        }}
      />
    </HeartRateAlertProvider>
  );
}
