import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { COLORS } from "../constants/colors";
import SplashScreen from "../screens/SplashScreen";
import { getAccessToken } from "../utils/authStorage";

// 로그인되어 있으면 바로 홈, 아니면 01 스플래시
export default function Index() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let ignore = false;
    getAccessToken().then((token) => {
      if (ignore) return;
      if (token) {
        router.replace("/home");
      } else {
        setChecked(true);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (!checked) return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  return <SplashScreen />;
}
