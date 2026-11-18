// src/screens/SignupPasswordScreen.tsx
// 05 비밀번호 / 20 비밀번호 오류 → 가입 완료 시 회원가입 API 호출

import { router } from "expo-router";
import React, { useRef, useState } from "react";
import type { TextInputInstance } from "react-native";
import { signup } from "../api/authApi";
import { isApiError } from "../api/client";
import PrimaryButton from "../components/common/PrimaryButton";
import TextField from "../components/common/TextField";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import StepProgress from "../components/StepProgress";
import { saveAccessToken } from "../utils/authStorage";
import { clearSignupDraft, getSignupDraft } from "../utils/signupDraft";
import { validatePassword, validatePasswordConfirm } from "../utils/validation";

export default function SignupPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<TextInputInstance>(null);

  const handleSubmit = async () => {
    if (loading) return;
    const nextErrors = {
      password: validatePassword(password),
      confirm: validatePasswordConfirm(password, confirm),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    setLoading(true);
    try {
      const result = await signup({ ...getSignupDraft(), password });
      await saveAccessToken(result.accessToken);
      clearSignupDraft();
      router.dismissAll();
      router.replace("/signup/complete");
    } catch (error) {
      if (isApiError(error) && error.code === "AUTH-002") {
        // 아이디 중복 → 04 아이디 화면으로 돌아가 오류 표시
        router.navigate({ pathname: "/signup/account", params: { error: "duplicate" } });
        return;
      }
      setErrors({
        confirm: isApiError(error) ? error.message : "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout footer={<PrimaryButton label="가입 완료" onPress={handleSubmit} loading={loading} />}>
      <StepProgress step={3} />
      <PageTitle title={"안전하게 사용할\n비밀번호를 정해요"} />
      <TextField
        label="비밀번호"
        placeholder="8자 이상 입력"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrors((prev) => ({ ...prev, password: null }));
        }}
        error={errors.password}
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <TextField
        ref={confirmRef}
        label="비밀번호 확인"
        placeholder="한 번 더 입력"
        value={confirm}
        onChangeText={(text) => {
          setConfirm(text);
          setErrors((prev) => ({ ...prev, confirm: null }));
        }}
        error={errors.confirm}
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </ScreenLayout>
  );
}
