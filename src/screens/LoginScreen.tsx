// src/screens/LoginScreen.tsx
// 02 로그인 / 17 로그인 오류

import { router } from "expo-router";
import React, { useRef, useState } from "react";
import type { TextInputInstance } from "react-native";
import { login } from "../api/authApi";
import { isApiError } from "../api/client";
import PrimaryButton from "../components/common/PrimaryButton";
import TextField from "../components/common/TextField";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { saveAccessToken } from "../utils/authStorage";
import { goHome } from "../utils/navigation";

const CHECK_INPUT = "입력 내용을 확인해 주세요.";

export default function LoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ loginId?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  const handleLogin = async () => {
    if (loading) return;
    const nextErrors = {
      loginId: loginId.trim() ? undefined : CHECK_INPUT,
      password: password ? undefined : CHECK_INPUT,
    };
    setErrors(nextErrors);
    if (nextErrors.loginId || nextErrors.password) return;

    setLoading(true);
    try {
      const result = await login({ loginId: loginId.trim(), password });
      await saveAccessToken(result.accessToken);
      goHome();
    } catch (error) {
      if (isApiError(error) && error.code === "AUTH-001") {
        setErrors({ loginId: CHECK_INPUT, password: CHECK_INPUT });
      } else {
        setErrors({ password: isApiError(error) ? error.message : "잠시 후 다시 시도해 주세요." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      footer={
        <>
          <PrimaryButton label="로그인" onPress={handleLogin} loading={loading} />
          <PrimaryButton
            label="처음이에요 · 회원가입"
            variant="secondary"
            onPress={() => router.push("/signup/profile")}
          />
        </>
      }
    >
      <PageTitle
        eyebrow="WELCOME BACK"
        title="다시 만나 반가워요"
        description="나만의 속도로 시작해 보세요."
      />
      <TextField
        label="아이디"
        placeholder="아이디 입력"
        value={loginId}
        onChangeText={(text) => {
          setLoginId(text);
          setErrors((prev) => ({ ...prev, loginId: undefined }));
        }}
        error={errors.loginId}
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        placeholder="비밀번호 입력"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        secureTextEntry
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
    </ScreenLayout>
  );
}
