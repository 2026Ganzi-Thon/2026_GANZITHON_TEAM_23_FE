// 워치 심박 수신 (WatchConnectivity, 아이폰 쪽)
// - 앱 실행 직후부터 WCSession을 켠다. (PulseWatchAppDelegate)
// - 받은 샘플은 검증 → 수신함(UserDefaults)에 저장한 뒤에 워치로 ACK를 보낸다.
// - sampleId로 중복을 걸러 같은 샘플은 한 번만 수신함에 넣는다.
// - JS가 처리했다고 알려줄 때(markProcessed)까지 수신함에 남겨 둔다.
//   → JS가 없던 백그라운드 수신분은 다음 실행 때 getPendingSamples로 가져간다.

import Foundation
import WatchConnectivity

final class WatchReceiver: NSObject, WCSessionDelegate {
    static let shared = WatchReceiver()

    /// 새 샘플을 받았을 때 (원본 JSON 객체). 모듈이 JS 이벤트로 넘긴다.
    var onSample: (([String: Any]) -> Void)?

    private let queue = DispatchQueue(label: "pulse.watch.receiver") // 모든 상태 변경은 이 직렬 큐에서
    private let defaults = UserDefaults.standard
    private let inboxKey = "pulse.watch.inbox"
    private let seenKey = "pulse.watch.seen"
    private let inboxLimit = 2000
    private let seenLimit = 10000

    private var inbox: [Data] = [] // 처리 전 샘플 원본 JSON
    private var seen: [String] = [] // 최근 수신한 sampleId
    private var started = false

    private override init() {
        super.init()
        inbox = (defaults.array(forKey: inboxKey) as? [Data]) ?? []
        seen = defaults.stringArray(forKey: seenKey) ?? []
    }

    func start() {
        queue.sync {
            guard !started, WCSession.isSupported() else { return }
            started = true
            let session = WCSession.default
            session.delegate = self // 앱 전체에 delegate는 하나만
            session.activate()
        }
    }

    // MARK: - JS 쪽 API

    func pendingSamples() -> [[String: Any]] {
        queue.sync { inbox.compactMap(Self.jsonObject) }
    }

    func markProcessed(_ ids: [String]) {
        queue.sync {
            let done = Set(ids)
            inbox.removeAll { data in
                guard let id = (Self.jsonObject(data))?["sampleId"] as? String else { return true }
                return done.contains(id)
            }
            defaults.set(inbox, forKey: inboxKey)
        }
    }

    func status() -> [String: Any] {
        guard WCSession.isSupported() else { return ["supported": false] }
        let session = WCSession.default
        let pendingCount = queue.sync { inbox.count }
        return [
            "supported": true,
            "activated": session.activationState == .activated,
            "paired": session.isPaired,
            "watchAppInstalled": session.isWatchAppInstalled,
            "reachable": session.isReachable,
            "pendingCount": pendingCount,
        ]
    }

    // MARK: - 수신 처리

    /// 검증·저장에 성공하면 sampleId(중복 포함), 실패하면 nil
    private func receive(_ message: [String: Any]) -> String? {
        guard message["type"] as? String == "pulse.heartRate",
              let data = message["payload"] as? Data,
              let sample = try? HeartRateSample.decode(data),
              message["sampleId"] as? String == sample.sampleId else {
            return nil
        }
        if seen.contains(sample.sampleId) { return sample.sampleId } // 이미 받은 샘플 → ACK만

        inbox.append(data)
        if inbox.count > inboxLimit { inbox.removeFirst(inbox.count - inboxLimit) }
        defaults.set(inbox, forKey: inboxKey)

        seen.append(sample.sampleId)
        if seen.count > seenLimit { seen.removeFirst(seen.count - seenLimit) }
        defaults.set(seen, forKey: seenKey)

        if let object = Self.jsonObject(data) {
            let handler = onSample
            DispatchQueue.main.async { handler?(object) }
        }
        return sample.sampleId
    }

    private static func jsonObject(_ data: Data) -> [String: Any]? {
        (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        queue.async {
            // 수신함 저장이 끝난 뒤에 ACK
            replyHandler(["ack": self.receive(message) ?? "invalid"])
        }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        queue.async { _ = self.receive(userInfo) }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
}
