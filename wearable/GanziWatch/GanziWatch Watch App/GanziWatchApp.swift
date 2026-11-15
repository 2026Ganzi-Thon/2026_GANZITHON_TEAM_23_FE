import SwiftUI

@main struct GanziWatch_Watch_AppApp: App {
    @StateObject private var health = HealthService()
    var body: some Scene {
        WindowGroup { ContentView(health: health) }
    }
}
