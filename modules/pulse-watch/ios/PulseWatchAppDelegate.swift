import ExpoModulesCore

/// JS가 뜨기 전, 앱 실행 직후부터 워치 수신을 시작한다. (wearable/INTEGRATION.md)
public class PulseWatchAppDelegate: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        WatchReceiver.shared.start()
        return true
    }
}
