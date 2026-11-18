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
    var isMock: Bool { source == "mock" }
    func isStale(at now: Date = Date()) -> Bool { now.timeIntervalSince(measuredAt) > 300 }
    init(id: String, bpm: Double, at: Date, steps: Int?, source: String) {
        schemaVersion = 1; sampleId = id; self.bpm = bpm; measuredAt = at
        self.steps = steps; stepsWindowStart = at.addingTimeInterval(-300)
        stepsWindowEnd = at; self.source = source
    }
    static func encode(_ sample: Self) throws -> Data {
        let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
        // Explicit null is part of the wire contract, unlike synthesized Optional encoding.
        let data = try encoder.encode(sample)
        var object = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        if sample.steps == nil { object["steps"] = NSNull() }
        return try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
    }
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

enum MockScenario: String, CaseIterable {
    case normal = "정상", spike = "급상승", active = "활동 중 상승", missing = "걸음 정보 없음", duplicate = "중복 샘플"
    func samples(at now: Date = Date()) -> [HeartRateSample] {
        let values: [Double] = self == .normal ? [72,74,73,75,72] : [72,74,73,75,72,108,110,109]
        let samples = values.enumerated().map { index, bpm in
            HeartRateSample(id: "mock-\(UUID().uuidString)", bpm: bpm,
                            at: now.addingTimeInterval(Double(index - values.count + 1) * 10),
                            steps: self == .missing ? nil : (self == .active ? 120 : 0), source: "mock")
        }
        return self == .duplicate ? [samples[0], samples[0]] : samples
    }
}
