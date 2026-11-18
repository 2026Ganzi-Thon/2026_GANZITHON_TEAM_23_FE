#!/usr/bin/env python3
"""Runs paired simulators without UI automation. Never treats injection as WC delivery."""
import argparse
import base64
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
PHONE_BUNDLE = 'com.ganzithon.team23.PulseReceiver'
WATCH_BUNDLE = PHONE_BUNDLE + '.watchkitapp'


def command(*args):
    result = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f'{args}: {result.stderr or result.stdout}')
    return result.stdout.strip()


def sim(*args):
    return command('xcrun', 'simctl', *args)


def journal(device, bundle, run):
    container = Path(sim('get_app_container', device, bundle, 'data'))
    try:
        values = json.loads((container / 'Documents/PulseSimulatorAudit.json').read_text())
        return [entry for entry in values if entry['run'] == run]
    except FileNotFoundError:
        return []


def encoded(samples):
    return base64.b64encode(json.dumps(samples).encode()).decode()


def verify(events, expected, transport):
    received = {e['sample']['sampleId']: e['sample'] for e in events
                if e['event'] == 'receive' and e['detail'] == transport}
    return {
        'expected': len(expected), 'received': sum(s['sampleId'] in received for s in expected),
        'exactMatch': all(received.get(s['sampleId']) == s for s in expected),
        'missingIds': [s['sampleId'] for s in expected if s['sampleId'] not in received],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-install', action='store_true', help='Reuse apps already installed on the pair')
    parser.add_argument('--build-root', default='/tmp/pulse-ios-build')
    parser.add_argument('--output', default=str(ROOT / 'wearable/test-results/latest'))
    args = parser.parse_args()
    output = Path(args.output); output.mkdir(parents=True, exist_ok=True)
    inventory = json.loads(sim('list', '-j'))
    pairs = inventory['pairs']
    available = {d['udid'] for devices in inventory['devices'].values() for d in devices if d.get('isAvailable')}
    candidates = [(pid, p) for pid, p in pairs.items()
                  if p.get('phone', {}).get('udid') in available and p.get('watch', {}).get('udid') in available]
    if not candidates:
        raise RuntimeError('No available existing pair. Create a compatible pair with simctl pair WATCH PHONE; no devices are erased.')
    pair_id, pair = next(((pid, p) for pid, p in candidates if p['phone'].get('state') == 'Booted'), candidates[0])
    phone, watch = pair['phone']['udid'], pair['watch']['udid']
    for device in (pair['phone'], pair['watch']):
        if device['state'] != 'Booted': sim('boot', device['udid'])
        sim('bootstatus', device['udid'], '-b')
    build = Path(args.build_root) / 'Build/Products'
    for device, app in [(phone, build / 'Debug-iphonesimulator/PulseReceiver.app'),
                        (watch, build / 'Debug-watchsimulator/PulseCompanionWatch.app')]:
        if not app.exists(): raise RuntimeError(f'Build artifact missing: {app}')
        if not args.skip_install: sim('install', device, str(app))
    run = 'wc-' + uuid.uuid4().hex[:12]
    start = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(minutes=14)
    fixtures = []
    scenarios = {}
    for name, values, steps in [('normal', [72, 74, 73], 0),
                                ('spike', [72, 74, 73, 108, 110, 109], 0),
                                ('active', [72, 74, 73, 108, 110, 109], 120)]:
        group = []
        for index, bpm in enumerate(values):
            end = start + timedelta(minutes=len(fixtures))
            iso = lambda date: date.isoformat().replace('+00:00', 'Z')
            sample = dict(schemaVersion=1, sampleId=f'mock-{run}-{name}-{index}', bpm=bpm,
                          measuredAt=iso(end), steps=steps, stepsWindowStart=iso(end-timedelta(minutes=5)),
                          stepsWindowEnd=iso(end), source='mock')
            fixtures.append(sample); group.append(sample)
        scenarios[name] = group
    (output / 'fixtures.json').write_text(json.dumps(scenarios, indent=2))
    phone_launch = sim('launch', '--terminate-running-process', phone, PHONE_BUNDLE, '--pulse-test-run', run)
    watch_launch = sim('launch', '--terminate-running-process', watch, WATCH_BUNDLE,
                       '--pulse-test-run', run, '--pulse-send-base64', encoded(fixtures))
    print(f'Launched {phone_launch}; {watch_launch}. Waiting up to 40s for actual WC delivery.', flush=True)
    deadline = time.monotonic() + 40
    while time.monotonic() < deadline:
        events = journal(phone, PHONE_BUNDLE, run)
        ack_ids = {e['sample']['sampleId'] for e in journal(watch, WATCH_BUNDLE, run) if e['event'] == 'ack'}
        if verify(events, fixtures, 'WatchConnectivity.sendMessage')['exactMatch'] and all(s['sampleId'] in ack_ids for s in fixtures): break
        time.sleep(2)
    phone_events, watch_events = journal(phone, PHONE_BUNDLE, run), journal(watch, WATCH_BUNDLE, run)
    result = dict(run=run, pairId=pair_id, phone=pair['phone'], watch=pair['watch'],
                  phoneLaunch=phone_launch, watchLaunch=watch_launch,
                  actualWatchConnectivity={name: verify(phone_events, group, 'WatchConnectivity.sendMessage')
                                           for name, group in scenarios.items()})
    (output / 'phone-wc-audit.json').write_text(json.dumps(phone_events, indent=2))
    (output / 'watch-wc-audit.json').write_text(json.dumps(watch_events, indent=2))
    result['watchSentCount'] = len([e for e in watch_events if e['event'] == 'sendMessage'])
    result['watchAckCount'] = len([e for e in watch_events if e['event'] == 'ack'])
    ack_ids = {e['sample']['sampleId'] for e in watch_events if e['event'] == 'ack'}
    result['currentFixtureAckCount'] = sum(s['sampleId'] in ack_ids for s in fixtures)
    result['injection'] = {'performed': False}
    if not all(v['exactMatch'] for v in result['actualWatchConnectivity'].values()):
        injected_run = 'injection-' + uuid.uuid4().hex[:12]
        injection_scenarios = {name: [dict(s, sampleId=s['sampleId'].replace(run, injected_run)) for s in group]
                               for name, group in scenarios.items()}
        injection_samples = [s for group in injection_scenarios.values() for s in group]
        missing = dict(injection_samples[-1], sampleId=f'mock-{injected_run}-missing', steps=None)
        injection_samples.append(missing)
        sim('launch', '--terminate-running-process', phone, PHONE_BUNDLE, '--pulse-test-run', injected_run,
            '--pulse-inject-base64', encoded(injection_samples + [injection_samples[0]]))
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            injected_events = journal(phone, PHONE_BUNDLE, injected_run)
            if any(e['event'] == 'automationFinished' for e in injected_events): break
            time.sleep(1)
        result['injection'] = dict(performed=True, run=injected_run,
            scenarios={name: verify(injected_events, group, 'SIMULATOR MOCK INJECTION · WC 아님')
                       for name, group in injection_scenarios.items()},
            missingSteps=verify(injected_events, [missing], 'SIMULATOR MOCK INJECTION · WC 아님'),
            duplicateEvents=len([e for e in injected_events if e['event'] == 'duplicate']),
            uniqueReceiveCount=len([e for e in injected_events if e['event'] == 'receive']))
        (output / 'phone-injection-audit.json').write_text(json.dumps(injected_events, indent=2))
    for device, name in [(phone, 'phone'), (watch, 'watch')]:
        sim('io', device, 'screenshot', str(output / f'{name}.png'))
        result[f'{name}AppInfo'] = sim('appinfo', device, PHONE_BUNDLE if name == 'phone' else WATCH_BUNDLE)
    result['pairAfterTest'] = json.loads(sim('list', 'pairs', '-j'))
    (output / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({k: result[k] for k in ['run', 'actualWatchConnectivity', 'watchSentCount', 'watchAckCount', 'injection']}, ensure_ascii=False, indent=2), flush=True)
    if not result['injection']['performed'] and result['currentFixtureAckCount'] != len(fixtures):
        raise RuntimeError('Actual WC delivery received but sender ACK verification incomplete')
    if result['injection']['performed']:
        if not all(v['exactMatch'] for v in result['injection']['scenarios'].values()): raise RuntimeError('Mock injection mismatch')
        if not result['injection']['missingSteps']['exactMatch'] or result['injection']['duplicateEvents'] != 1:
            raise RuntimeError('Missing steps or deduplication test failed')


if __name__ == '__main__':
    main()
