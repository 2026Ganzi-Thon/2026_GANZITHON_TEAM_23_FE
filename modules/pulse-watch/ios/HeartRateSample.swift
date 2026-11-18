// 워치 ↔ 아이폰 메시지 계약 v1 (wearable/INTEGRATION.md)
// wearable/Shared/HeartRateSample.swift 의 데이터 정의·검증과 동일하게 유지한다.
// 워치 쪽 계약이 바뀌면 이 파일도 함께 바꾼다. (Mock 시나리오는 워치 전용이라 제외)

import Foundation

struct HeartRateSample: Codable, Equatable, Identifiable {
    let schemaVersion: Int
    let sampleId: String
    let bpm: Double
    let measuredAt: Date
    let steps: Int?
    let stepsWindowStart: Date
    let stepsWindowEnd: Date
    let source: String
    var id: String { sampleId }

    static func decode(_ data: Data) throws -> Self {
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        let sample = try decoder.decode(Self.self, from: data)
        guard sample.schemaVersion == 1, sample.bpm.isFinite, sample.bpm > 0,
              !sample.sampleId.isEmpty, ["healthKit", "mock"].contains(sample.source),
              sample.steps.map({ $0 >= 0 }) ?? true,
              sample.stepsWindowEnd == sample.measuredAt,
              sample.stepsWindowEnd.timeIntervalSince(sample.stepsWindowStart) == 300 else {
            throw CocoaError(.coderReadCorrupt)
        }
        return sample
    }
}
