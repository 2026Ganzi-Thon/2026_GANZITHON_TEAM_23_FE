import Foundation

// Explicit opt-in, DEBUG + simulator only. Never injects into HealthKit.
enum SimulatorTestSupport {
    private static var started = false
    static func record(_ event: String, sample: HeartRateSample? = nil, detail: String = "") {
        #if DEBUG && targetEnvironment(simulator)
        guard let run = argument("--pulse-test-run"), sample == nil || sample?.isMock == true else { return }
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("PulseSimulatorAudit.json")
        do {
            var records = (try? Data(contentsOf: url)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [[String: Any]] } ?? []
            var entry: [String: Any] = ["run": run, "event": event, "detail": detail, "recordedAt": ISO8601DateFormatter().string(from: Date())]
            if let sample { entry["sample"] = try JSONSerialization.jsonObject(with: HeartRateSample.encode(sample)) }
            records.append(entry)
            try JSONSerialization.data(withJSONObject: Array(records.suffix(5000)), options: [.prettyPrinted, .sortedKeys]).write(to: url, options: .atomic)
        } catch { NSLog("PULSE test audit failed: %@", error.localizedDescription) }
        #endif
    }
    private static func argument(_ key: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: key), args.indices.contains(index + 1) else { return nil }
        return args[index + 1]
    }
    @MainActor static func runIfRequested(watch: Bool) async {
        #if DEBUG && targetEnvironment(simulator)
        guard !started, argument("--pulse-test-run") != nil else { return }
        started = true
        record("launch", detail: watch ? "watch" : "phone")
        guard let encoded = argument(watch ? "--pulse-send-base64" : "--pulse-inject-base64"),
              let data = Data(base64Encoded: encoded),
              let objects = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return }
        if watch { try? await Task.sleep(for: .seconds(3)) }
        for object in objects {
            do {
                let sample = try HeartRateSample.decode(JSONSerialization.data(withJSONObject: object))
                guard sample.isMock else { record("fixtureError", detail: "Only mock source allowed"); continue }
                if watch { _ = ConnectivityService.shared.enqueue(sample) }
                else { ConnectivityService.shared.injectSimulatorSample(sample) }
            } catch { record("fixtureError", detail: error.localizedDescription) }
        }
        // Allow simulator pairing/activation to settle; retries use real WCSession only.
        if watch {
            for _ in 0..<10 {
                try? await Task.sleep(for: .seconds(2))
                ConnectivityService.shared.flush()
            }
        }
        record("automationFinished")
        #endif
    }
}
