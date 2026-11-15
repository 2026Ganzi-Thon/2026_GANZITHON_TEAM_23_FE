// swift-tools-version: 6.0
import PackageDescription
let package = Package(name: "PulseContract", products: [.library(name: "PulseContract", targets: ["PulseContract"])], targets: [
    .target(name: "PulseContract", path: "Shared", exclude: ["ConnectivityService.swift", "SimulatorTestSupport.swift"]),
    .testTarget(name: "PulseContractTests", dependencies: ["PulseContract"], path: "Tests")
])
