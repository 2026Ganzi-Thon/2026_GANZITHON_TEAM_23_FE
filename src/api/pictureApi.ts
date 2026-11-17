// src/api/pictureApi.ts
// 숨은그림 API (API명세서 5장)
// - 활동을 시작할 때마다 모드에 맞는 그림과 찾을 대상 위치를 받아와 숨은그림찾기 화면에 띄운다.

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import type { Mode } from "./types";

export interface PictureTarget {
  targetId: string;
  label: string; // 사물 모드 "고양이" / 색 모드 "보라색"
  emoji: string; // 찾았을 때 표시
  x: number; // 그림 너비 기준 중심 좌표 (0~1)
  y: number; // 그림 높이 기준 중심 좌표 (0~1)
  radius: number; // 정답 인정 반경 (그림 너비 기준, 0~1)
}

// 서버 응답 (API명세서 5.1)
interface PictureResponse {
  pictureId: string;
  mode: Mode;
  imageUrl: string;
  aspectRatio: number; // 너비 / 높이
  targets: PictureTarget[];
}

// 화면에서 쓰는 형태 — 더미는 로컬 에셋(require)을 쓰기 위해 image로 통일
export interface Picture extends Omit<PictureResponse, "imageUrl"> {
  image: string | number;
}

// 더미 그림: 피그마 UIUX "공원 일러스트" (850 x 1850)
// 좌표는 이 그림(고양이 3마리) 기준이다. 명세서 예시는 BE 그림(고양이 4마리) 기준이라 값이 다르다.
const PARK_IMAGE = require("../../assets/images/mock/scene-park.jpg");
const PARK_RATIO = 850 / 1850;

const MOCK_PICTURES: Record<Mode, Picture> = {
  OBJECT: {
    pictureId: "mock-park-object",
    mode: "OBJECT",
    image: PARK_IMAGE,
    aspectRatio: PARK_RATIO,
    targets: [
      { targetId: "cat-tree", label: "고양이", emoji: "🐱", x: 0.136, y: 0.195, radius: 0.1 }, // 나무 위
      { targetId: "cat-rock", label: "고양이", emoji: "🐱", x: 0.588, y: 0.482, radius: 0.08 }, // 연못 옆 바위 뒤
      { targetId: "cat-picnic", label: "고양이", emoji: "🐱", x: 0.79, y: 0.843, radius: 0.13 }, // 피크닉 돗자리
    ],
  },
  COLOR: {
    pictureId: "mock-park-color",
    mode: "COLOR",
    image: PARK_IMAGE,
    aspectRatio: PARK_RATIO,
    targets: [
      { targetId: "purple-daisy", label: "보라색", emoji: "💜", x: 0.09, y: 0.69, radius: 0.07 }, // 왼쪽 꽃밭
      { targetId: "purple-hydrangea-1", label: "보라색", emoji: "💜", x: 0.06, y: 0.875, radius: 0.09 }, // 왼쪽 아래 수국
      { targetId: "purple-hydrangea-2", label: "보라색", emoji: "💜", x: 0.215, y: 0.93, radius: 0.09 }, // 아래 수국
    ],
  },
};

/** 숨은그림 받기 (alertId가 있으면 해당 알림에서 시작한 활동) */
export const getPicture = async (mode: Mode, alertId?: string): Promise<Picture> => {
  if (USE_MOCK.picture) {
    return mockResolve(MOCK_PICTURES[mode], 500);
  }
  const query = new URLSearchParams({ mode });
  if (alertId) query.set("alertId", alertId);
  const { imageUrl, ...rest } = await api.get<PictureResponse>(`/pictures/next?${query}`);
  return { ...rest, image: imageUrl };
};
