import SwiftUI

@main struct PulseReceiverApp: App {
    @ObservedObject private var connection = ConnectivityService.shared
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                List {
                    Section("통신 상태") {
                        Text(connection.status)
                        Text("수신 경로: \(connection.receiveTransport)")
                        Text("이번 실행 신규 수신: \(connection.receivedCount)")
                        Button("연결 / 전송 재시도") { connection.flush() }
                    }
                    if let sample = connection.latest {
                        Section(sample.isMock ? "MOCK · 실제 데이터 아님" : "실제 HealthKit") {
                            Text("\(Int(sample.bpm)) BPM").font(.largeTitle)
                            Text(sample.measuredAt.formatted(date: .abbreviated, time: .standard))
                            Text("걸음: \(sample.steps.map(String.init) ?? "알 수 없음 (null)")")
                            TimelineView(.periodic(from: .now, by: 30)) { context in Text(sample.isStale(at: context.date) ? "오래된 데이터" : "최근 데이터") }
                            Text(sample.sampleId).font(.caption)
                        }
                    } else { Text("워치에서 실제 샘플 또는 Mock을 전송하세요.") }
                    Text("Expo 통합 전 통신 검증용 앱입니다. 급상승 판정·API 호출·알림은 수행하지 않습니다.")
                }.navigationTitle("PULSE 수신 테스트")
                .task { await SimulatorTestSupport.runIfRequested(watch: false) }
            }
        }
    }
}
