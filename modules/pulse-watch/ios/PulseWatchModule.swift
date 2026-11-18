import ExpoModulesCore
import Foundation
import UIKit
import WatchConnectivity

private let inboxChanged = Notification.Name("PulseWatchInboxChanged")

private struct InboxState: Codable {
  var pending: [HeartRateSample] = []
  var seen: [String] = []
}

final class PulseInbox: NSObject, WCSessionDelegate {
  static let shared = PulseInbox()
  private var state = InboxState()
  private let file = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("PulseWatch/inbox.json")
  private let session = WCSession.isSupported() ? WCSession.default : nil
  override init() {
    super.init()
    if let data = try? Data(contentsOf: file), let saved = try? JSONDecoder().decode(InboxState.self, from: data) { state = saved }
    session?.delegate = self
    session?.activate()
  }
  private func persist(_ next: InboxState) throws {
    try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
    try JSONEncoder().encode(next).write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    state = next
  }
  func pending() -> [[String: Any]] {
    state.pending.compactMap { sample in
      guard let data = try? HeartRateSample.encode(sample) else { return nil }
      return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }
  }
  func acknowledge(_ ids: [String]) throws {
    var next = state
    next.pending.removeAll { ids.contains($0.id) }
    try persist(next)
  }
  func status() -> [String: Any] {
    ["supported": WCSession.isSupported(), "activated": session?.activationState == .activated, "reachable": session?.isReachable == true, "installed": session?.isWatchAppInstalled == true, "watchAppInstalled": session?.isWatchAppInstalled == true, "paired": session?.isPaired == true, "pendingCount": state.pending.count]
  }
  private func receive(_ message: [String: Any]) -> String? {
    guard message["type"] as? String == "pulse.heartRate", let data = message["payload"] as? Data,
      let sample = try? HeartRateSample.decode(data), message["sampleId"] as? String == sample.id else { return nil }
    if state.seen.contains(sample.id) { testRecord("duplicate", id: sample.id, mock: sample.isMock); return sample.id }
    guard state.pending.count < 2000 else { return nil }
    var next = state
    next.pending.append(sample)
    next.seen.append(sample.id)
    // Preserve IDs for all unprocessed entries, plus bounded processed history.
    next.seen = Array(next.seen.suffix(10000))
    do { try persist(next) } catch { return nil }
    testRecord("wcReceived", id: sample.id, mock: sample.isMock)
    NotificationCenter.default.post(name: inboxChanged, object: nil)
    return sample.id
  }
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    DispatchQueue.main.async { replyHandler(["ack": self.receive(message) ?? "retry"]) }
  }
  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
    DispatchQueue.main.async { _ = self.receive(userInfo) }
  }
}

private func testOptions() -> [String: Any] {
  #if DEBUG && targetEnvironment(simulator)
  let args = ProcessInfo.processInfo.arguments
  if let i = args.firstIndex(of: "--pulse-integration-test"), args.indices.contains(i+1) {
    return ["enabled": true, "run": args[i+1], "shouldAlert": !args.contains("--pulse-api-no-alert")]
  }
  #endif
  return ["enabled": false, "run": "", "shouldAlert": false]
}
private func testRecord(_ event: String, id: String, mock: Bool) {
  guard mock, testOptions()["enabled"] as? Bool == true else { return }
  let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("PulseIntegrationAudit.json")
  var events = (try? Data(contentsOf: url)).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [[String: String]] } ?? []
  events.append(["event": event, "sampleId": id, "run": testOptions()["run"] as? String ?? ""])
  try? JSONSerialization.data(withJSONObject: Array(events.suffix(3000)), options: [.prettyPrinted]).write(to: url, options: .atomic)
}

public class PulseWatchAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    _ = PulseInbox.shared
    return true
  }
}
public class PulseWatchModule: Module {
  private var observer: NSObjectProtocol?
  public func definition() -> ModuleDefinition {
    Name("PulseWatch")
    Events("onSamplesAvailable")
    OnStartObserving {
      self.observer = NotificationCenter.default.addObserver(forName: inboxChanged, object: nil, queue: .main) { [weak self] _ in self?.sendEvent("onSamplesAvailable") }
    }
    OnStopObserving { if let observer = self.observer { NotificationCenter.default.removeObserver(observer) }; self.observer = nil }
    AsyncFunction("getPending") { () -> [[String: Any]] in PulseInbox.shared.pending() }.runOnQueue(.main)
    AsyncFunction("acknowledge") { (ids: [String]) in try PulseInbox.shared.acknowledge(ids) }.runOnQueue(.main)
    AsyncFunction("getStatus") { () -> [String: Any] in PulseInbox.shared.status() }.runOnQueue(.main)
    Function("getTestOptions") { testOptions() }
    Function("recordTestEvent") { (event: String, id: String) in
      DispatchQueue.main.async { testRecord(event, id: id, mock: id.hasPrefix("mock-")) }
    }
  }
}
