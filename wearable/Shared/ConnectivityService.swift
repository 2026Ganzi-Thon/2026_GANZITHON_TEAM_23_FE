import Foundation
import Combine
import WatchConnectivity

// WCSession delegates arrive on arbitrary queues; all mutable state belongs to main.
final class ConnectivityService: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = ConnectivityService()
    @Published private(set) var status = "연결 준비 중"
    @Published private(set) var latest: HeartRateSample?
    @Published private(set) var receivedCount = 0
    @Published private(set) var receiveTransport = "수신 대기"
    @Published var simulateOffline = false { didSet { if !simulateOffline { flush() } } }
    private var pending: [HeartRateSample] = []
    private var seen: [String] = []
    private var inFlight: Set<String> = []
    private let defaults = UserDefaults.standard
    private let session = WCSession.isSupported() ? WCSession.default : nil
    override init() {
        super.init()
        if let data = defaults.data(forKey: "pulse.pending") {
            pending = (try? JSONDecoder().decode([HeartRateSample].self, from: data)) ?? []
        }
        seen = defaults.stringArray(forKey: "pulse.seen") ?? []
        if let data = defaults.data(forKey: "pulse.latest") { latest = try? HeartRateSample.decode(data) }
        session?.delegate = self; session?.activate()
    }
    @discardableResult func enqueue(_ sample: HeartRateSample) -> Bool {
        guard !seen.contains(sample.id), !pending.contains(where: { $0.id == sample.id }) else { return true }
        // Never advance HealthKit's anchor if the bounded outbox is full.
        guard pending.count < 2000 else { status = "전송함 가득 참: iPhone 연결 후 새로고침"; return false }
        SimulatorTestSupport.record("enqueue", sample: sample)
        pending.append(sample); save(); flush(); return true
    }
    private func save() { defaults.set(try? JSONEncoder().encode(pending), forKey: "pulse.pending") }
    private func remember(_ id: String) {
        if !seen.contains(id) { seen.append(id) }
        seen = Array(seen.suffix(10000)); defaults.set(seen, forKey: "pulse.seen")
    }
    private func finish(_ id: String) {
        pending.removeAll { $0.id == id }; inFlight.remove(id); remember(id); save(); updateStatus()
    }
    func flush() {
        guard let session, session.activationState == .activated, !simulateOffline else { updateStatus(); return }
        #if os(watchOS)
        guard session.isCompanionAppInstalled else { status = "iPhone 수신 앱 미설치 · 대기 \(pending.count)"; return }
        #endif
        let queued = Set(session.outstandingUserInfoTransfers.compactMap { $0.userInfo["sampleId"] as? String })
        for sample in pending where !inFlight.contains(sample.id) && !queued.contains(sample.id) {
            guard let data = try? HeartRateSample.encode(sample) else { continue }
            let envelope: [String: Any] = ["type": "pulse.heartRate", "sampleId": sample.id, "payload": data]
            inFlight.insert(sample.id)
            if session.isReachable {
                SimulatorTestSupport.record("sendMessage", sample: sample)
                session.sendMessage(envelope, replyHandler: { reply in
                    DispatchQueue.main.async {
                        if reply["ack"] as? String == sample.id { SimulatorTestSupport.record("ack", sample: sample); self.finish(sample.id) }
                        else { self.queueBackground(envelope, id: sample.id) }
                    }
                }, errorHandler: { error in DispatchQueue.main.async { SimulatorTestSupport.record("sendError", sample: sample, detail: error.localizedDescription); self.queueBackground(envelope, id: sample.id) } })
            } else { queueBackground(envelope, id: sample.id) }
        }
        updateStatus()
    }
    private func queueBackground(_ envelope: [String: Any], id: String) {
        guard !simulateOffline else { inFlight.remove(id); return }
        #if targetEnvironment(simulator)
        inFlight.remove(id)
        status = "시뮬레이터: 백그라운드 전송 미지원 · 즉시 연결 후 재시도"
        SimulatorTestSupport.record("backgroundUnsupported", detail: id)
        #else
        session?.transferUserInfo(envelope)
        // Outbox remains durable until WC reports transfer completion.
        updateStatus()
        #endif
    }
    private func updateStatus() {
        SimulatorTestSupport.record("connection", detail: "activation=\(session?.activationState.rawValue ?? -1),reachable=\(session?.isReachable ?? false)")
        status = "\(session?.activationState == .activated ? "활성" : "비활성") · \(session?.isReachable == true ? "즉시 연결" : "지연 전송") · 대기 \(pending.count)\(simulateOffline ? " · 오프라인 모의" : "")"
    }
    private func receive(_ message: [String: Any], transport: String) -> String? {
        guard message["type"] as? String == "pulse.heartRate", let data = message["payload"] as? Data,
              let sample = try? HeartRateSample.decode(data), message["sampleId"] as? String == sample.id else {
            status = "수신 스키마 오류"; return nil
        }
        SimulatorTestSupport.record(seen.contains(sample.id) ? "duplicate" : "receive", sample: sample, detail: transport)
        if !seen.contains(sample.id) {
            receiveTransport = transport
            remember(sample.id); receivedCount += 1
            if latest == nil || sample.measuredAt >= latest!.measuredAt {
                latest = sample; defaults.set(data, forKey: "pulse.latest")
            }
        }
        return sample.id
    }
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { if let error { self.status = error.localizedDescription } else { self.flush() } }
    }
    func sessionReachabilityDidChange(_ session: WCSession) { DispatchQueue.main.async { self.flush() } }
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async { replyHandler(["ack": self.receive(message, transport: "WatchConnectivity.sendMessage") ?? "invalid"]) }
    }
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        DispatchQueue.main.async { _ = self.receive(userInfo, transport: "WatchConnectivity.transferUserInfo") }
    }
    func session(_ session: WCSession, didFinish userInfoTransfer: WCSessionUserInfoTransfer, error: Error?) {
        DispatchQueue.main.async {
            guard let id = userInfoTransfer.userInfo["sampleId"] as? String else { return }
            if let error { self.inFlight.remove(id); self.status = "전송 실패: \(error.localizedDescription) · 새로고침으로 재시도" }
            else { self.finish(id) }
        }
    }
    #if DEBUG && targetEnvironment(simulator)
    func injectSimulatorSample(_ sample: HeartRateSample) {
        guard sample.isMock, let data = try? HeartRateSample.encode(sample) else { return }
        _ = receive(["type": "pulse.heartRate", "sampleId": sample.id, "payload": data], transport: "SIMULATOR MOCK INJECTION · WC 아님")
    }
    #endif
    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) { DispatchQueue.main.async { self.updateStatus() } }
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    #endif
}
