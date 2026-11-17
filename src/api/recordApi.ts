// src/api/recordApi.ts
// 활동 기록 API (API명세서 6장)
// - 6.1 목록 (14 활동 기록)
// - 6.2 저장 (12 활동 후 상태)
// - 6.3 다음 행동 기록 (13 다음 행동 선택)

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import type { Mode, MoodScore, NextAction } from "./types";

export interface ActivityRecord {
  recordId: number;
  activityName: string; // 항상 "숨은그림찾기"
  mode: Mode;
  pictureId: string | null;
  beforeScore: MoodScore | null; // 활동 전 점수 (건너뛰면 null)
  afterScore: MoodScore;
  nextAction: NextAction | null; // 아직 안 골랐으면 null
  createdAt: string; // ISO 8601
}

export interface CreateRecordRequest {
  mode: Mode;
  pictureId: string | null;
  alertId: string | null;
  beforeScore: MoodScore | null;
  afterScore: MoodScore;
}

// 더미 모드에서 앱을 켜 둔 동안 기록을 유지
let mockRecords: ActivityRecord[] = [];

/** 6.1 활동 기록 목록 (최신순) */
export const getRecords = async (): Promise<ActivityRecord[]> => {
  if (USE_MOCK.record) {
    return mockResolve([...mockRecords]);
  }
  return api.get<ActivityRecord[]>("/records");
};

/** 6.2 활동 기록 저장 — 응답의 recordId를 6.3에 사용 */
export const createRecord = async (body: CreateRecordRequest): Promise<ActivityRecord> => {
  if (USE_MOCK.record) {
    const record: ActivityRecord = {
      recordId: mockRecords.length + 1,
      activityName: "숨은그림찾기",
      mode: body.mode,
      pictureId: body.pictureId,
      beforeScore: body.beforeScore,
      afterScore: body.afterScore,
      nextAction: null,
      createdAt: new Date().toISOString(),
    };
    mockRecords = [record, ...mockRecords];
    return mockResolve(record);
  }
  return api.post<ActivityRecord>("/records", body);
};

/** 6.3 다음 행동 기록 — 같은 기록에 다시 보내면 마지막 값으로 덮어씀 */
export const saveNextAction = async (recordId: number, action: NextAction): Promise<void> => {
  if (USE_MOCK.record) {
    mockRecords = mockRecords.map((record) =>
      record.recordId === recordId ? { ...record, nextAction: action } : record,
    );
    return mockResolve(undefined);
  }
  return api.post<void>(`/records/${recordId}/next-action`, { action });
};
