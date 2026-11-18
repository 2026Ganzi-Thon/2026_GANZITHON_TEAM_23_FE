// src/screens/SignupAccountScreen.tsx
// 04 아이디 / 19 아이디 오류

import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import PrimaryButton from "../components/common/PrimaryButton";
import TextField from "../components/common/TextField";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import StepProgress from "../components/StepProgress";
import { getSignupDraft, updateSignupDraft } from "../utils/signupDraft";
import { validateLoginId } from "../utils/validation";

export default function SignupAccountScreen() {
  // 05 비밀번호 화면에서 아이디 중복으로 돌아온 경우 error=duplicate
  const { error: errorParam } = useLocalSearchParams<{ error?: string }>();
  const [loginId, setLoginId] = useState(getSignupDraft().loginId);
  const [error, setError] = useState<string | null>(
    errorParam === "duplicate" ? "이미 사용 중인 아이디예요." : null,
  );

  const handleNext = () => {
    const nextError = validateLoginId(loginId);
    setError(nextError);
    if (nextError) return;

    updateSignupDraft({ loginId: loginId.trim() });
    router.push("/signup/password");
  };

  return (
    <ScreenLayout footer={<PrimaryButton label="다음" onPress={handleNext} />}>
      <StepProgress step={2} />
      <PageTitle title={"사용할 아이디를\n알려주세요"} />
      <TextField
        label="아이디"
        placeholder="영문과 숫자 4자 이상"
        value={loginId}
        onChangeText={(text) => {
          setLoginId(text);
          setError(null);
        }}
        error={error}
        maxLength={20}
        textContentType="username"
        returnKeyType="done"
        onSubmitEditing={handleNext}
      />
    </ScreenLayout>
  );
}
