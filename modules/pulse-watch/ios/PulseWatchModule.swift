import ExpoModulesCore

public class PulseWatchModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PulseWatch")

        Events("onHeartRateSample")

        OnCreate {
            WatchReceiver.shared.start()
            WatchReceiver.shared.onSample = { [weak self] sample in
                self?.sendEvent("onHeartRateSample", sample)
            }
        }

        OnDestroy {
            WatchReceiver.shared.onSample = nil
        }

        /// JS가 아직 처리하지 않은 샘플 (앱이 꺼져 있던 동안 받은 것 포함)
        AsyncFunction("getPendingSamples") { () -> [[String: Any]] in
            WatchReceiver.shared.pendingSamples()
        }

        /// 처리한 샘플을 수신함에서 지운다.
        Function("markProcessed") { (sampleIds: [String]) in
            WatchReceiver.shared.markProcessed(sampleIds)
        }

        /// 연결 상태 (페어링, 워치 앱 설치, 즉시 연결 가능 여부, 대기 개수)
        Function("getStatus") { () -> [String: Any] in
            WatchReceiver.shared.status()
        }
    }
}
