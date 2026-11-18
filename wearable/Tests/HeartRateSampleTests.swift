import XCTest
@testable import PulseContract

final class HeartRateSampleTests: XCTestCase {
    func testUnknownStepsAreExplicitNullAndZeroSurvivesRoundTrip() throws {
        for steps: Int? in [nil, 0, 120] {
            let sample = HeartRateSample(id: "sample", bpm: 74, at: Date(timeIntervalSince1970: 1800000000), steps: steps, source: "healthKit")
            let data = try HeartRateSample.encode(sample)
            let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
            XCTAssertNotNil(object["steps"])
            if steps == nil { XCTAssertTrue(object["steps"] is NSNull) }
            XCTAssertEqual(try HeartRateSample.decode(data), sample)
        }
    }
    func testRejectsUnknownSchemaAndInvalidValues() throws {
        let sample = MockScenario.normal.samples()[0]
        let data = try HeartRateSample.encode(sample)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        for (key, value): (String, Any) in [("schemaVersion", 2), ("bpm", -1), ("steps", -1), ("source", "unknown"), ("sampleId", "")] {
            var invalid = object; invalid[key] = value
            XCTAssertThrowsError(try HeartRateSample.decode(JSONSerialization.data(withJSONObject: invalid)))
        }
    }
    func testScenariosKeepMotionAndMissingDistinct() {
        XCTAssertTrue(MockScenario.missing.samples().allSatisfy { $0.steps == nil && $0.isMock })
        XCTAssertTrue(MockScenario.active.samples().allSatisfy { $0.steps == 120 })
        let spike = MockScenario.spike.samples()
        XCTAssertEqual(spike.suffix(3).map(\.bpm), [108, 110, 109])
        XCTAssertTrue(spike.allSatisfy { $0.steps == 0 })
        let duplicate = MockScenario.duplicate.samples()
        XCTAssertEqual(duplicate[0].sampleId, duplicate[1].sampleId)
    }
    func testWindowAndStaleBoundary() {
        let now = Date(timeIntervalSince1970: 1800000000)
        let sample = HeartRateSample(id: "s", bpm: 70, at: now, steps: nil, source: "healthKit")
        XCTAssertEqual(sample.stepsWindowEnd.timeIntervalSince(sample.stepsWindowStart), 300)
        XCTAssertFalse(sample.isStale(at: now.addingTimeInterval(300)))
        XCTAssertTrue(sample.isStale(at: now.addingTimeInterval(301)))
    }
    func testSpikeFixtureCanReachDetectorWithFiveRecentBaselineSamples() {
        let now = Date(timeIntervalSince1970: 1800000000)
        let samples = MockScenario.spike.samples(at: now)
        XCTAssertGreaterThanOrEqual(samples.count, 8)
        let baseline = samples.prefix(5).map(\.bpm)
        let average = baseline.reduce(0, +) / Double(baseline.count)
        XCTAssertTrue(samples.suffix(3).allSatisfy { $0.bpm >= average + 25 })
        XCTAssertTrue(samples.allSatisfy { $0.steps == 0 && $0.isMock && !$0.isStale(at: now) })
    }

}
