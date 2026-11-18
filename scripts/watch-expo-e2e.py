#!/usr/bin/env python3
"""Actual WC only. No direct mobile injection. Synthetic mock sample IDs only."""
import argparse,base64,json,subprocess,time,uuid
from datetime import datetime,timedelta,timezone
from pathlib import Path
PHONE='80CD9174-D192-4BBD-8D3B-718BC8D22D90'
WATCH='00F85884-6A4F-4635-AE17-8F8D64ABC827'
PHONE_APP='com.ganzithon.team23.pulse';WATCH_APP=PHONE_APP+'.watchkitapp'
parser=argparse.ArgumentParser();parser.add_argument('--scenario');parser.add_argument('--phone',default=PHONE);parser.add_argument('--watch',default=WATCH);parser.add_argument('--output',default='wearable/test-results/expo-e2e');args=parser.parse_args()
PHONE=args.phone;WATCH=args.watch
OUT=Path(args.output);OUT.mkdir(parents=True,exist_ok=True)
def sim(*args):return subprocess.check_output(['xcrun','simctl',*args],text=True).strip()
def events(device,bundle,file,run):
 p=Path(sim('get_app_container',device,bundle,'data'))/'Documents'/file
 if not p.exists():return []
 return [e for e in json.loads(p.read_text()) if e.get('run')==run]
def fixture(run,mode):
 bpms=[72,74,73,75,72]+([] if mode=='normal' else [108,110,109])
 now=datetime.now(timezone.utc).replace(microsecond=0)
 if mode=='stale':now-=timedelta(minutes=10)
 values=[]
 for i,bpm in enumerate(bpms):
  end=now-timedelta(seconds=(len(bpms)-1-i)*10)
  iso=lambda d:d.isoformat().replace('+00:00','Z')
  steps=120 if mode=='active' and i>=5 else (None if mode=='unknown' and i>=5 else 0)
  values.append(dict(schemaVersion=1,sampleId=f'mock-{run}-{i}',bpm=bpm,steps=steps,source='mock',measuredAt=iso(end),stepsWindowStart=iso(end-timedelta(minutes=5)),stepsWindowEnd=iso(end)))
 if mode=='duplicate':values=values[:6]+[values[5],values[5]]
 return values
scenarios=[args.scenario] if args.scenario else ['normal','active','unknown','stale','duplicate','no-alert','spike']
results=[]
for mode in scenarios:
 run='expo-'+mode+'-'+uuid.uuid4().hex[:8];values=fixture(run,mode)
 args=['-EXDevMenuIsOnboardingFinished','YES','-EXDevMenuShowsAtLaunch','NO','--initialUrl','http://127.0.0.1:8081','--pulse-integration-test',run]+(['--pulse-api-no-alert'] if mode=='no-alert' else [])
 sim('launch','--terminate-running-process',PHONE,PHONE_APP,*args)
 time.sleep(5)
 sim('launch','--terminate-running-process',WATCH,WATCH_APP,'--pulse-test-run',run,'--pulse-send-base64',base64.b64encode(json.dumps(values).encode()).decode())
 deadline=time.monotonic()+50;expected={s['sampleId'] for s in values}
 while time.monotonic()<deadline:
  phone=events(PHONE,PHONE_APP,'PulseIntegrationAudit.json',run)
  watch=events(WATCH,WATCH_APP,'PulseSimulatorAudit.json',run)
  got={e['sampleId'] for e in phone if e['event']=='wcReceived'}
  js={e['sampleId'] for e in phone if e['event']=='jsReceived'}
  ack={e['sample']['sampleId'] for e in watch if e['event']=='ack'}
  if expected<=got and expected<=js and expected<=ack:
   if mode not in ['spike','no-alert'] or any(e['event'].startswith('apiShouldAlert') for e in phone):break
  time.sleep(2)
 time.sleep(2)
 phone=events(PHONE,PHONE_APP,'PulseIntegrationAudit.json',run)
 alert=any(e['event']=='alertRequested' for e in phone)
 api_ok = mode not in ['spike','no-alert'] or any(e['event']==('apiShouldAlertTrue' if mode=='spike' else 'apiShouldAlertFalse') for e in phone)
 result=dict(scenario=mode,run=run,expected=len(expected),received=len(expected&got),jsReceived=len(expected&js),acks=len(expected&ack),alertRequested=alert,passed=expected<=got and expected<=js and expected<=ack and api_ok and alert==(mode=='spike'),injection=False)
 results.append(result)
 (OUT/f'{mode}.json').write_text(json.dumps(dict(result=result,phoneEvents=phone,watchEvents=watch),indent=2))
 sim('io',PHONE,'screenshot',str(OUT/f'{mode}.png'))
 print(json.dumps(result),flush=True)
 if not result['passed']:break
(OUT/'results.json').write_text(json.dumps(results,indent=2))
if len(results)!=len(scenarios) or not all(r['passed'] for r in results):raise SystemExit(1)
