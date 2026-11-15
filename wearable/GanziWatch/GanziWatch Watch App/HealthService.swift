import Foundation
import Combine
import HealthKit

@MainActor final class HealthService: ObservableObject {
    @Published private(set) var latest: HeartRateSample?
    @Published private(set) var status = "읽기 권한을 요청해 주세요"
    @Published private(set) var backgroundStatus = "백그라운드 미설정"
    private let store = HKHealthStore()
    private let heart = HKQuantityType.quantityType(forIdentifier: .heartRate)!
    private let steps = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    private var observer: HKObserverQuery?
    private var fetching = false
    private var rerun = false
    private var completions: [() -> Void] = []
    private let defaults = UserDefaults.standard
    private let syncStart: Date
    private var anchor: HKQueryAnchor? {
        guard let data = defaults.data(forKey: "pulse.anchor") else { return nil }
        return try? NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: data)
    }
    init() {
        let start = UserDefaults.standard.object(forKey: "pulse.syncStart") as? Date ?? Date().addingTimeInterval(-86400)
        syncStart = start
        UserDefaults.standard.set(start, forKey: "pulse.syncStart")
        if let data = defaults.data(forKey: "pulse.health.latest") { latest = try? HeartRateSample.decode(data) }
        if defaults.bool(forKey: "pulse.requested") { startObservation(); refresh() }
    }
    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { status = "HealthKit 사용 불가"; return }
        do {
            try await store.requestAuthorization(toShare: [], read: [heart, steps])
            defaults.set(true, forKey: "pulse.requested")
            // Completion only means the permission sheet completed, not that read access was granted.
            startObservation(); refresh()
        } catch { status = "권한 요청 실패: \(error.localizedDescription)" }
    }
    private func startObservation() {
        guard observer == nil else { return }
        let query = HKObserverQuery(sampleType: heart, predicate: nil) { [weak self] _, completion, error in
            Task { @MainActor [weak self] in
                guard let self else { completion(); return }
                if let error { self.status = "관찰 오류: \(error.localizedDescription)"; completion(); return }
                self.completions.append(completion); self.refresh()
            }
        }
        observer = query; store.execute(query)
        store.enableBackgroundDelivery(for: heart, frequency: .immediate) { [weak self] success, error in
            Task { @MainActor [weak self] in self?.backgroundStatus = success ? "백그라운드 등록됨 · 전달 시각 보장 없음" : "백그라운드 실패: \(error?.localizedDescription ?? "알 수 없음")" }
        }
    }
    func refresh() {
        guard !fetching else { rerun = true; return }
        fetching = true
        // Fixed predicate is important: never change the predicate behind a persisted anchor.
        let predicate = HKQuery.predicateForSamples(withStart: syncStart, end: nil, options: .strictStartDate)
        let query = HKAnchoredObjectQuery(type: heart, predicate: predicate, anchor: anchor, limit: 100) { [weak self] _, samples, _, newAnchor, error in
            Task { @MainActor [weak self] in
                guard let self else { return }
                if let error { self.status = "읽기 실패: \(error.localizedDescription)"; self.complete(); return }
                let values = (samples as? [HKQuantitySample] ?? []).sorted { $0.endDate < $1.endDate }
                var accepted = true
                for value in values {
                    let count = await self.stepCount(at: value.endDate)
                    let sample = HeartRateSample(id: value.uuid.uuidString, bpm: value.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())), at: value.endDate, steps: count, source: "healthKit")
                    if !ConnectivityService.shared.enqueue(sample) { accepted = false; break }
                    if self.latest == nil || sample.measuredAt >= self.latest!.measuredAt { self.latest = sample; self.defaults.set(try? HeartRateSample.encode(sample), forKey: "pulse.health.latest") }
                }
                if accepted, let newAnchor, let data = try? NSKeyedArchiver.archivedData(withRootObject: newAnchor, requiringSecureCoding: true) {
                    self.defaults.set(data, forKey: "pulse.anchor")
                }
                self.status = accepted ? (values.isEmpty ? "신규 데이터 없음 · 읽기 권한 확인 (거부 여부 판별 불가)" : "HealthKit 읽기 완료") : "전송함 가득 참 · 재연결 후 재시도"
                if accepted && values.count == 100 { self.rerun = true }
                self.complete()
            }
        }
        store.execute(query)
    }
    private func complete() {
        fetching = false
        if rerun { rerun = false; refresh(); return }
        let callbacks = completions; completions.removeAll(); callbacks.forEach { $0() }
    }
    private func stepCount(at end: Date) async -> Int? {
        await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: end.addingTimeInterval(-300), end: end, options: [.strictStartDate, .strictEndDate])
            let query = HKStatisticsQuery(quantityType: steps, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
                // No visible quantity is unknown, never proof of zero motion.
                guard error == nil, let quantity = result?.sumQuantity() else { continuation.resume(returning: nil); return }
                continuation.resume(returning: Int(quantity.doubleValue(for: .count())))
            }
            store.execute(query)
        }
    }
}
