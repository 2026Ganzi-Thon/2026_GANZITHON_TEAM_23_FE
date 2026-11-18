Pod::Spec.new do |s|
  s.name           = 'PulseWatch'
  s.version        = '1.0.0'
  s.summary        = 'Receives Apple Watch heart-rate samples over WatchConnectivity'
  s.description    = 'Receives Apple Watch heart-rate samples over WatchConnectivity'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WatchConnectivity'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
