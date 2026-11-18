const { withXcodeProject, withPodfileProperties } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const plist = require('@expo/plist').default;
function ensureDependency(project, main, watch) {
  project.hash.project.objects.PBXContainerItemProxy ||= {};
  project.hash.project.objects.PBXTargetDependency ||= {};
  const deps = project.hash.project.objects.PBXTargetDependency;
  if (!project.pbxNativeTargetSection()[main].dependencies.some(ref => deps[ref.value]?.target === watch)) project.addTargetDependency(main, [watch]);
}

// Generated native files live under ios/ and can be recreated on every prebuild.
module.exports = config => {
  config = withPodfileProperties(config, config => { config.modResults["ios.deploymentTarget"] = "17.0"; return config; });
  return withXcodeProject(config, config => {
  const project = config.modResults;
  const root = config.modRequest.projectRoot;
  const ios = config.modRequest.platformProjectRoot;
  const name = 'PulseExpoWatch';
  const phoneId = config.ios.bundleIdentifier;
  const existing = Object.values(project.pbxNativeTargetSection()).find(t => typeof t === 'object' && t.name?.replaceAll('"','') === name);
  const folder = path.join(ios, name);
  fs.mkdirSync(folder, { recursive: true });
  const sources = [
    ['wearable/GanziWatch/GanziWatch Watch App', ['GanziWatchApp.swift', 'ContentView.swift', 'HealthService.swift']],
    ['wearable/Shared', ['HeartRateSample.swift', 'ConnectivityService.swift', 'SimulatorTestSupport.swift']],
  ];
  for (const [source, files] of sources) for (const file of files) fs.copyFileSync(path.join(root, source, file), path.join(folder, file));
  fs.cpSync(path.join(root,'wearable/GanziWatch/GanziWatch Watch App/Assets.xcassets'),path.join(folder,'Assets.xcassets'),{recursive:true});
  fs.copyFileSync(path.join(root,'wearable/GanziWatch/HealthKit.entitlements'),path.join(folder,'HealthKit.entitlements'));
  fs.writeFileSync(path.join(folder,'Info.plist'),plist.build({
    CFBundleDevelopmentRegion: 'en', CFBundleDisplayName: 'PULSE Watch', CFBundleExecutable: '$(EXECUTABLE_NAME)',
    CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)', CFBundleInfoDictionaryVersion: '6.0',
    CFBundleName: '$(PRODUCT_NAME)', CFBundlePackageType: 'APPL', CFBundleShortVersionString: config.version || '1.0.0',
    CFBundleVersion: config.ios.buildNumber || '1', WKApplication: true,
    WKCompanionAppBundleIdentifier: phoneId, WKRunsIndependentlyOfCompanionApp: true,
    NSHealthShareUsageDescription: 'PULSE가 심박수와 최근 5분 걸음 수를 읽어 iPhone에 전달합니다.',
  }));
  const main = project.getFirstTarget().uuid;
  const mainList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
  for (const ref of mainList.buildConfigurations) {
    const settings = project.pbxXCBuildConfigurationSection()[ref.value].buildSettings;
    settings.IPHONEOS_DEPLOYMENT_TARGET = '17.0';
    if (config.ios.appleTeamId) settings.DEVELOPMENT_TEAM = config.ios.appleTeamId;
    settings['"CODE_SIGN_IDENTITY[sdk=iphonesimulator*]"'] = '"-"';
  }
  // node-xcode serializes unset optional fields as literal `undefined`; omit them.
  for (const group of Object.values(project.hash.project.objects.PBXGroup)) {
    if (group && typeof group === 'object' && group.name?.replaceAll('"','') === name) delete group.path;
  }
  for (const file of Object.values(project.pbxFileReferenceSection())) {
    if (file && typeof file === 'object' && file.path?.includes(name+'/')) {
      for (const key of ['explicitFileType','fileEncoding']) if (file[key] === undefined || file[key] === 'undefined') delete file[key];
    }
  }
  if (existing) {
    const watchId = Object.entries(project.pbxNativeTargetSection()).find(([,t]) => t === existing)[0];
    ensureDependency(project, main, watchId);
    const watchList = project.pbxXCConfigurationList()[existing.buildConfigurationList];
    for (const ref of watchList.buildConfigurations) {
      const settings = project.pbxXCBuildConfigurationSection()[ref.value].buildSettings;
      if (config.ios.appleTeamId) settings.DEVELOPMENT_TEAM = config.ios.appleTeamId;
      settings['"CODE_SIGN_IDENTITY[sdk=watchsimulator*]"'] = '"-"';
    }
    return config;
  }
  const target = project.addTarget(name,'application',name,`${phoneId}.watchkitapp`);
  project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
  project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
  project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
  const group = project.addPbxGroup([], name);
  delete project.hash.project.objects.PBXGroup[group.uuid].path;
  project.addToPbxGroup(group.uuid,project.getFirstProject().firstProject.mainGroup);
  for (const [, files] of sources) for (const file of files) project.addSourceFile(`${name}/${file}`,{target:target.uuid},group.uuid);
  project.addResourceFile(`${name}/Assets.xcassets`,{target:target.uuid},group.uuid);
  const list = project.pbxXCConfigurationList()[target.pbxNativeTarget.buildConfigurationList];
  for (const ref of list.buildConfigurations) {
    const build = project.pbxXCBuildConfigurationSection()[ref.value];
    Object.assign(build.buildSettings,{
      SDKROOT:'watchos', WATCHOS_DEPLOYMENT_TARGET:'26.0', TARGETED_DEVICE_FAMILY:'4',
      INFOPLIST_FILE:`${name}/Info.plist`, CODE_SIGN_ENTITLEMENTS:`${name}/HealthKit.entitlements`,
      SWIFT_VERSION:'5.0', PRODUCT_NAME:'"$(TARGET_NAME)"', PRODUCT_BUNDLE_IDENTIFIER:`${phoneId}.watchkitapp`,
      DEVELOPMENT_TEAM:config.ios.appleTeamId || '', '"CODE_SIGN_IDENTITY[sdk=watchsimulator*]"':'"-"',
      SKIP_INSTALL:'YES', CODE_SIGN_STYLE:'Automatic', ASSETCATALOG_COMPILER_APPICON_NAME:'AppIcon',
      LD_RUNPATH_SEARCH_PATHS:'"$(inherited) @executable_path/Frameworks"',
    });
    if (build.name === 'Debug') build.buildSettings.SWIFT_ACTIVE_COMPILATION_CONDITIONS='"DEBUG $(inherited)"';
    delete build.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
  }
  ensureDependency(project, main, target.uuid);
  const phase = project.addBuildPhase([], 'PBXCopyFilesBuildPhase','Embed Watch Content',main,'watch2_app','"$(CONTENTS_FOLDER_PATH)/Watch"');
  const id = project.generateUuid();
  project.pbxBuildFileSection()[id]={isa:'PBXBuildFile',fileRef:target.pbxNativeTarget.productReference,fileRef_comment:`${name}.app`,settings:{ATTRIBUTES:['RemoveHeadersOnCopy']}};
  project.pbxBuildFileSection()[`${id}_comment`]=`${name}.app in Embed Watch Content`;
  phase.buildPhase.files.push({value:id,comment:`${name}.app in Embed Watch Content`});
  for (const file of Object.values(project.pbxFileReferenceSection())) {
    if (file && typeof file === 'object' && file.path?.includes(name+'/')) {
      for (const key of ['explicitFileType','fileEncoding']) if (file[key] === undefined || file[key] === 'undefined') delete file[key];
    }
  }
  return config;
});
};
