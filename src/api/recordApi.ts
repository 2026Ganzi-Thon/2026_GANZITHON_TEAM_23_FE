// src/api/recordApi.ts
// 활동 기록 API (14 활동 기록, 12 활동 후 상태 → 기록하기)

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import type { MoodScore } from "./types";

export interface ActivityRecord {
  recordId: number;
  activityName: string; // "숨은그림찾기"
  pictureId: string | null;
  beforeScore: MoodScore | null; // 활동 전 점수 (건너뛰면 null)
  afterScore: MoodScore;
  createdAt: string; // ISO 8601
}

export interface CreateRecordRequest {
  pictureId: string | null;
  alertId: string | null;
  beforeScore: MoodScore | null;
  afterScore: MoodScore;
}

// 더미 모드에서 앱을 켜 둔 동안 기록을 유지
let mockRecords: ActivityRecord[] = [];

export const getRecords = async (): Promise<ActivityRecord[]> => {
  if (USE_MOCK.record) {
    return mockResolve([...mockRecords]);
  }
  return api.get<ActivityRecord[]>("/records");
};

export const createRecord = async (
  body: CreateRecordRequest,
): Promise<ActivityRecord> => {
  if (USE_MOCK.record) {
    const record: ActivityRecord = {
      recordId: mockRecords.length + 1,
      activityName: "숨은그림찾기",
      pictureId: body.pictureId,
      beforeScore: body.beforeScore,
      afterScore: body.afterScore,
      createdAt: new Date().toISOString(),
    };
    mockRecords = [record, ...mockRecords];
    return mockResolve(record);
  }
  return api.post<ActivityRecord>("/records", body);
};
