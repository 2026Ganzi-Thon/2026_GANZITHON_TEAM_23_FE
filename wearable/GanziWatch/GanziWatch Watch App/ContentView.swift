import SwiftUI

struct ContentView: View {
    @ObservedObject var health: HealthService
    @ObservedObject private var connection = ConnectivityService.shared
    @Environment(\.scenePhase) private var phase
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("PULSE").font(.headline)
                if let sample = health.latest {
                    Text("실제 \(Int(sample.bpm)) BPM").font(.title2)
                    Text(sample.measuredAt, style: .time)
                    TimelineView(.periodic(from: .now, by: 30)) { context in
                        Text(sample.isStale(at: context.date) ? "오래된 데이터 (5분 초과)" : "최근 데이터")
                    }
                    Text("최근 5분 걸음: \(sample.steps.map(String.init) ?? "알 수 없음")")
                }
                Text(health.status); Text(health.backgroundStatus); Text(connection.status)
                Button("HealthKit 읽기 권한") { Task { await health.requestAuthorization() } }
                Button("새로고침 / 전송 재시도") { health.refresh(); connection.flush() }
                Text("측정 간격·실시간 전달은 보장되지 않습니다.").font(.footnote)
                #if DEBUG
                Divider(); Text("MOCK · 실제 건강 데이터 아님")
                ForEach(MockScenario.allCases, id: \.self) { scenario in
                    Button(scenario.rawValue) { scenario.samples().forEach { _ = connection.enqueue($0) } }
                }
                Toggle("연결 끊김 모의", isOn: $connection.simulateOffline)
                #endif
            }.font(.caption).padding()
        }
        .task { await SimulatorTestSupport.runIfRequested(watch: true) }
        .onChange(of: phase) { _, phase in if phase == .active { connection.flush(); health.refresh() } }
    }
}
