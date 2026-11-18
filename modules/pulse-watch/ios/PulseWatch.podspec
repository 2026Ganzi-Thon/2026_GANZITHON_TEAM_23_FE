Pod::Spec.new do |s|
  s.name = 'PulseWatch'
  s.version = '1.0.0'
  s.summary = 'PULSE WatchConnectivity receiver'
  s.description = 'Persistent inbox and Expo events for the PULSE companion watch.'
  s.license = { :type => 'MIT' }
  s.author = 'PULSE'
  s.homepage = 'https://github.com/2026Ganzi-Thon/2026_GANZITHON_TEAM_23_FE'
  s.source = { :git => s.homepage }
  s.platform = :ios, '17.0'
  s.swift_version = '5.0'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
