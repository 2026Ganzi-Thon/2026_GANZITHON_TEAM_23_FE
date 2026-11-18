// src/screens/SignupProfileScreen.tsx
// 03 이름 · 닉네임 · 이메일 / 18 회원가입 입력 오류

import { router } from "expo-router";
import React, { useRef, useState } from "react";
import type { TextInputInstance } from "react-native";
import PrimaryButton from "../components/common/PrimaryButton";
import TextField from "../components/common/TextField";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import StepProgress from "../components/StepProgress";
import { getSignupDraft, updateSignupDraft } from "../utils/signupDraft";
import {
  NAME_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  validateEmail,
  validateName,
  validateNickname,
} from "../utils/validation";

type Field = "name" | "nickname" | "email";

export default function SignupProfileScreen() {
  const draft = getSignupDraft();
  const [values, setValues] = useState({
    name: draft.name,
    nickname: draft.nickname,
    email: draft.email,
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>({});
  const nicknameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);

  const change = (field: Field) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleNext = () => {
    const nextErrors = {
      name: validateName(values.name),
      nickname: validateNickname(values.nickname),
      email: validateEmail(values.email),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.nickname || nextErrors.email) return;

    updateSignupDraft({
      name: values.name.trim(),
      nickname: values.nickname.trim(),
      email: values.email.trim(),
    });
    router.push("/signup/account");
  };

  return (
    <ScreenLayout footer={<PrimaryButton label="다음" onPress={handleNext} />}>
      <StepProgress step={1} />
      <PageTitle title={"기분 좋은 만남을\n준비해 볼까요?"} />
      <TextField
        label="이름"
        placeholder="이름 입력"
        value={values.name}
        onChangeText={change("name")}
        error={errors.name}
        maxLength={NAME_MAX_LENGTH}
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => nicknameRef.current?.focus()}
      />
      <TextField
        ref={nicknameRef}
        label="닉네임"
        placeholder="불리고 싶은 이름"
        value={values.nickname}
        onChangeText={change("nickname")}
        error={errors.nickname}
        maxLength={NICKNAME_MAX_LENGTH}
        textContentType="nickname"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="이메일"
        placeholder="hello@example.com"
        value={values.email}
        onChangeText={change("email")}
        error={errors.email}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="done"
        onSubmitEditing={handleNext}
      />
    </ScreenLayout>
  );
}
