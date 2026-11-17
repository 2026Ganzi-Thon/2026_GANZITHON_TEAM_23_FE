// src/screens/MyPageScreen.tsx
// 마이페이지 — 내 정보 수정(7.2) · 보호자 등록·수정(7.3) · 보호자 삭제(7.4)
// 피그마 design 섹션에 화면이 없어 기존 화면 스타일(입력창, 버튼)로 구성

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { isApiError } from "../api/client";
import { deleteGuardian, getMe, Me, saveGuardian, updateMe } from "../api/userApi";
import PrimaryButton from "../components/common/PrimaryButton";
import TextField from "../components/common/TextField";
import PageTitle from "../components/PageTitle";
import ScreenLayout from "../components/ScreenLayout";
import { COLORS } from "../constants/colors";
import { formatPhone } from "../constants/helpContacts";
import { TYPO } from "../constants/typography";
import { scale } from "../utils/responsive";
import {
  NAME_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  validateEmail,
  validateName,
  validateNickname,
  validatePhone,
} from "../utils/validation";

type ProfileField = "name" | "nickname" | "email";
type GuardianField = "guardianName" | "guardianPhone";

const errorMessage = (error: unknown) =>
  isApiError(error) ? error.message : "잠시 후 다시 시도해 주세요.";

export default function MyPageScreen() {
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState({ name: "", nickname: "", email: "" });
  const [guardian, setGuardian] = useState({ guardianName: "", guardianPhone: "" });
  const [errors, setErrors] = useState<Partial<Record<ProfileField | GuardianField, string | null>>>({});
  const [saving, setSaving] = useState<"profile" | "guardian" | "delete" | null>(null);

  const applyMe = (data: Me) => {
    setMe(data);
    setProfile({ name: data.name, nickname: data.nickname, email: data.email });
    setGuardian({
      guardianName: data.guardian?.name ?? "",
      guardianPhone: data.guardian ? formatPhone(data.guardian.phone) : "",
    });
  };

  useEffect(() => {
    getMe()
      .then(applyMe)
      .catch((error) => Alert.alert("내 정보를 불러오지 못했어요", errorMessage(error)));
  }, []);

  const clearError = (field: ProfileField | GuardianField) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  const handleSaveProfile = async () => {
    if (!me || saving) return;
    const nextErrors = {
      name: validateName(profile.name),
      nickname: validateNickname(profile.nickname),
      email: validateEmail(profile.email),
    };
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (nextErrors.name || nextErrors.nickname || nextErrors.email) return;

    // 바뀐 필드만 보낸다. (7.2: 보낸 필드만 수정)
    const changes: Partial<Record<ProfileField, string>> = {};
    (["name", "nickname", "email"] as const).forEach((key) => {
      const value = profile[key].trim();
      if (value !== me[key]) changes[key] = value;
    });
    if (Object.keys(changes).length === 0) {
      Alert.alert("바뀐 내용이 없어요");
      return;
    }

    setSaving("profile");
    try {
      applyMe(await updateMe(changes));
      Alert.alert("내 정보를 저장했어요");
    } catch (error) {
      Alert.alert("저장하지 못했어요", errorMessage(error));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveGuardian = async () => {
    if (!me || saving) return;
    const nextErrors = {
      guardianName: validateName(guardian.guardianName),
      guardianPhone: validatePhone(guardian.guardianPhone),
    };
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (nextErrors.guardianName || nextErrors.guardianPhone) return;

    setSaving("guardian");
    try {
      const saved = await saveGuardian({
        name: guardian.guardianName.trim(),
        phone: guardian.guardianPhone,
      });
      applyMe({ ...me, guardian: saved });
      Alert.alert("보호자를 저장했어요");
    } catch (error) {
      Alert.alert("저장하지 못했어요", errorMessage(error));
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteGuardian = async () => {
    if (!me || saving) return;
    setSaving("delete");
    try {
      await deleteGuardian();
      applyMe({ ...me, guardian: null });
    } catch (error) {
      Alert.alert("삭제하지 못했어요", errorMessage(error));
    } finally {
      setSaving(null);
    }
  };

  if (!me) {
    return (
      <ScreenLayout>
        <PageTitle eyebrow="MY PAGE" title="내 정보" />
        <ActivityIndicator style={styles.loading} color={COLORS.primary} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <PageTitle
        eyebrow="MY PAGE"
        title="내 정보"
        description={`아이디 ${me.loginId} · 아이디는 바꿀 수 없어요.`}
      />

      <TextField
        label="이름"
        value={profile.name}
        onChangeText={(text) => {
          setProfile((prev) => ({ ...prev, name: text }));
          clearError("name");
        }}
        error={errors.name}
        maxLength={NAME_MAX_LENGTH}
      />
      <TextField
        label="닉네임"
        value={profile.nickname}
        onChangeText={(text) => {
          setProfile((prev) => ({ ...prev, nickname: text }));
          clearError("nickname");
        }}
        error={errors.nickname}
        maxLength={NICKNAME_MAX_LENGTH}
      />
      <TextField
        label="이메일"
        value={profile.email}
        onChangeText={(text) => {
          setProfile((prev) => ({ ...prev, email: text }));
          clearError("email");
        }}
        error={errors.email}
        keyboardType="email-address"
      />
      <PrimaryButton
        label="내 정보 저장"
        onPress={handleSaveProfile}
        loading={saving === "profile"}
      />

      <View style={styles.section}>
        <Text style={TYPO.eyebrow}>GUARDIAN</Text>
        <Text style={[TYPO.bodyBold, styles.sectionTitle]}>보호자 (1명)</Text>
        <Text style={TYPO.description}>
          도움 요청의 &quot;보호자에게 문자&quot;가 이 번호로 문자 앱을 열어요.
        </Text>
      </View>

      <TextField
        label="보호자 이름"
        placeholder="예: 엄마"
        value={guardian.guardianName}
        onChangeText={(text) => {
          setGuardian((prev) => ({ ...prev, guardianName: text }));
          clearError("guardianName");
        }}
        error={errors.guardianName}
        maxLength={NAME_MAX_LENGTH}
      />
      <TextField
        label="보호자 휴대폰 번호"
        placeholder="010-1234-5678"
        value={guardian.guardianPhone}
        onChangeText={(text) => {
          setGuardian((prev) => ({ ...prev, guardianPhone: text }));
          clearError("guardianPhone");
        }}
        error={errors.guardianPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />
      <View style={styles.buttons}>
        <PrimaryButton
          label={me.guardian ? "보호자 수정" : "보호자 등록"}
          onPress={handleSaveGuardian}
          loading={saving === "guardian"}
        />
        {me.guardian && (
          <PrimaryButton
            label="보호자 삭제"
            variant="secondary"
            onPress={handleDeleteGuardian}
            loading={saving === "delete"}
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: scale(60) },
  section: { paddingTop: scale(40) },
  sectionTitle: { paddingTop: scale(6), paddingBottom: scale(4) },
  buttons: { gap: scale(10) },
});
