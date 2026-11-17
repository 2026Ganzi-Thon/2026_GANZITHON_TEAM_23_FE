// src/api/pictureApi.ts
// 숨은그림찾기 그림 API
// - 알림 → 활동 시작 시 서버에서 그림과 찾을 사물 위치를 받아와 10 숨은그림찾기 화면에 띄운다.

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";

export interface PictureTarget {
  targetId: string;
  label: string; // "나비"
  emoji: string; // 찾았을 때 표시 (🦋)
  x: number; // 그림 너비 기준 중심 좌표 (0~1)
  y: number; // 그림 높이 기준 중심 좌표 (0~1)
  radius: number; // 정답 인정 반경 (그림 너비 기준, 0~1)
}

// 서버 응답 (API명세서 5.1)
interface PictureResponse {
  pictureId: string;
  imageUrl: string;
  aspectRatio: number; // 너비 / 높이
  targets: PictureTarget[];
}

// 화면에서 쓰는 형태 — 더미는 로컬 에셋(require)을 쓰기 위해 image로 통일
export interface Picture extends Omit<PictureResponse, "imageUrl"> {
  image: string | number;
}

// 더미 그림: 피그마 UIUX "공원 일러스트" (850 x 1850) — 고양이 3마리 찾기
const MOCK_PICTURE: Picture = {
  pictureId: "mock-park",
  image: require("../../assets/images/mock/scene-park.jpg"),
  aspectRatio: 850 / 1850,
  targets: [
    { targetId: "cat-tree", label: "고양이", emoji: "🐱", x: 0.136, y: 0.195, radius: 0.1 }, // 나무 위
    { targetId: "cat-rock", label: "고양이", emoji: "🐱", x: 0.588, y: 0.482, radius: 0.08 }, // 연못 옆 바위 뒤
    { targetId: "cat-picnic", label: "고양이", emoji: "🐱", x: 0.79, y: 0.843, radius: 0.13 }, // 피크닉 돗자리
  ],
};

/** 오늘의 그림 받기 (alertId가 있으면 해당 알림에서 시작한 활동) */
export const getPicture = async (alertId?: string): Promise<Picture> => {
  if (USE_MOCK.picture) {
    return mockResolve(MOCK_PICTURE, 500);
  }
  const query = alertId ? `?alertId=${encodeURIComponent(alertId)}` : "";
  const { imageUrl, ...rest } = await api.get<PictureResponse>(`/pictures/next${query}`);
  return { ...rest, image: imageUrl };
};
