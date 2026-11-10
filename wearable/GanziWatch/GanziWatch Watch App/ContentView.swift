//
//  ContentView.swift
//  GanziWatch Watch App
//
//  Created by 이나린 on 11/11/26.
//

import SwiftUI

struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "applewatch")
                .font(.system(size: 35))
                .foregroundStyle(.green)

            Text("GANZITHON")
                .font(.headline)
                .bold()

            Text("버튼 클릭: \(count)회")
                .font(.caption)

            Button("테스트하기") {
                count += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
