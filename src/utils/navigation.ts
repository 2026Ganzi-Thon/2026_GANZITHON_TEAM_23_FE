// src/utils/navigation.ts

import { router } from "expo-router";

/** 쌓인 화면을 모두 닫고 첫 화면으로 (로그인 여부에 따라 홈 / 스플래시로 분기) */
export const goHome = () => {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
};

/** 활동 흐름 사이에 넘기는 파라미터 (마음 점수는 문자열로 전달됨) */
export const parseScore = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const score = Number(raw);
  return score >= 1 && score <= 5 ? (score as 1 | 2 | 3 | 4 | 5) : null;
};

export const parseParam = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : null;
};
