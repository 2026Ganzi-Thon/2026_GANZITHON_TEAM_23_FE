import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
async function load(file, prefix='') {
  const source = readFileSync(new URL('../'+file,import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');
  return import('data:text/javascript;base64,'+Buffer.from(prefix+stripTypeScriptTypes(source)).toString('base64')+'#'+Math.random());
}
const { createSpikeDetector } = await load('src/services/heartRate/spikeDetector.ts');
const { decodeWatchSample } = await load('src/services/heartRate/types.ts');
const now = 1800000000000;
function series(steps=0) { return [72,74,73,75,72,108,110,109].map((bpm,i)=>({sampleId:'s'+i,bpm,steps,timestamp:now-8000+i*1000,source:'healthKit'})); }
function detector(extra={}) { return createSpikeDetector({now:()=>now,...extra}); }
for (const [name,steps,expected] of [['zero',0,1],['active',120,0],['unknown',null,0]]) test(name,()=>{
  const d=detector();const s=series(steps);assert.equal(s.map(x=>d.push(x)).filter(Boolean).length,expected);
});
test('normal baseline alone does not alert',()=>{const d=detector();assert.ok(series().slice(0,5).every(s=>d.push(s)===null));});
test('old and future samples blocked',()=>{for(const offset of [-600000,600000]) {const d=detector();assert.ok(series().map(s=>({...s,timestamp:s.timestamp+offset})).every(s=>d.push(s)===null));}});
test('duplicate high sample cannot satisfy three consecutive samples',()=>{const d=detector();series().slice(0,5).forEach(s=>d.push(s));const s=series()[5];assert.equal(d.push(s),null);assert.equal(d.push({...s,timestamp:s.timestamp+1000}),null);assert.equal(d.push({...s,timestamp:s.timestamp+2000}),null);});
test('late samples cannot rewrite sequence',()=>{const d=detector();const s=series();s.slice(0,5).forEach(x=>d.push(x));assert.equal(d.push(s[6]),null);assert.equal(d.push(s[5]),null);assert.equal(d.push(s[7]),null);});
test('API failure allows retry, successful report starts cooldown',()=>{
 const d=detector();const s=series();assert.ok(s.map(x=>d.push(x)).at(-1));d.reportFailed();assert.ok(d.push(s[7]));
 d.confirmReport();assert.ok([0,1,2].every(i=>d.push({...s[7],sampleId:'later'+i,timestamp:now+i})===null));
});
test('mock is opt-in and does not mix baseline with HealthKit',()=>{
 const blocked=detector();assert.ok(series().map(s=>({...s,source:'mock'})).every(s=>blocked.push(s)===null));
 const d=detector({allowMock:true});const s=series();s.slice(0,5).forEach(x=>d.push(x));assert.equal(d.push({...s[5],source:'mock'}),null);
 const m=detector({allowMock:true});assert.ok(series().map(s=>m.push({...s,source:'mock'})).at(-1));
});
test('wire schema converts measuredAt, preserves null and rejects bad windows',()=>{
 const s={schemaVersion:1,sampleId:'wire',bpm:109,steps:null,source:'healthKit',measuredAt:new Date(now).toISOString(),stepsWindowStart:new Date(now-300000).toISOString(),stepsWindowEnd:new Date(now).toISOString()};
 assert.deepEqual(decodeWatchSample(s),{sampleId:'wire',bpm:109,steps:null,timestamp:now,source:'healthKit'});
 assert.equal(decodeWatchSample({...s,stepsWindowStart:s.measuredAt}),null);
});
for(const shouldAlert of [false,true]) test('existing mock API shouldAlert='+shouldAlert,async()=>{
 const api=await load('src/api/heartRateApi.ts',`const PulseWatch={getTestOptions:()=>({enabled:true,shouldAlert:${shouldAlert}})}; const USE_MOCK={heartRate:false}; const mockResolve=async x=>x; const api={post:()=>{throw Error('network forbidden')}};\n`);
 const response=await api.reportHeartRateSpike({bpm:109,baselineBpm:73,steps:0,measuredAt:new Date(now).toISOString()});assert.equal(response.shouldAlert,shouldAlert);assert.equal(response.alertId===null,!shouldAlert);
});
test('watch source sorts inbox and acknowledges only after async processing',async()=>{
 const entries=[2,0,1].map(i=>({schemaVersion:1,sampleId:'order'+i,bpm:72,steps:0,source:'healthKit',measuredAt:new Date(now+i).toISOString(),stepsWindowStart:new Date(now+i-300000).toISOString(),stepsWindowEnd:new Date(now+i).toISOString()}));
 const calls=[];let finish;const completed=new Promise(r=>finish=r);
 globalThis.__pulseSourceFake={getPending:async()=>entries,acknowledge:async([id])=>{calls.push('ack:'+id);if(calls.length===6)finish();},addListener:()=>({remove(){}})};
 const prefix=`const PulseWatch=globalThis.__pulseSourceFake; const AppState={addEventListener:()=>({remove(){}})}; const decodeWatchSample=${decodeWatchSample.toString()};\n`;
 const {watchHeartRateSource}=await load('src/services/heartRate/watchSource.ts',prefix);
 const stop=watchHeartRateSource.subscribe(async s=>{await Promise.resolve();calls.push('sample:'+s.sampleId);});
 await completed;stop();delete globalThis.__pulseSourceFake;
 assert.deepEqual(calls,['sample:order0','ack:order0','sample:order1','ack:order1','sample:order2','ack:order2']);
});
test('explicit historical flag cannot warm baseline or trigger a spike',()=>{
 const d=detector();assert.ok(series().every(s=>d.push({...s,historical:true})===null));
 assert.equal(d.push({...series()[7],sampleId:'fresh-only',timestamp:now}),null);
});
test('latest object/color picture API preserves mode-specific data',async()=>{
 const api=await load('src/api/pictureApi.ts',`const USE_MOCK={picture:true};const mockResolve=async x=>x;const require=()=>1;const api={get:()=>{throw Error('network forbidden')}};\n`);
 for(const mode of ['OBJECT','COLOR']) {const picture=await api.getPicture(mode);assert.equal(picture.mode,mode);assert.equal(picture.targets.length,3);}
});
test('latest record API preserves mode and next-action update',async()=>{
 const api=await load('src/api/recordApi.ts',`const USE_MOCK={record:true};const mockResolve=async x=>x;const api={post:()=>{throw Error('network forbidden')}};\n`);
 const record=await api.createRecord({mode:'COLOR',pictureId:'mock-color',alertId:null,beforeScore:3,afterScore:2});
 await api.saveNextAction(record.recordId,'IMPROVED');const records=await api.getRecords();assert.equal(records[0].mode,'COLOR');assert.equal(records[0].nextAction,'IMPROVED');
});
test('latest user and guardian API remains available',async()=>{
 const api=await load('src/api/userApi.ts',`const USE_MOCK={user:true};const mockResolve=async x=>x;const api={get:()=>{throw Error('network forbidden')}};\n`);
 assert.equal((await api.updateMe({nickname:'통합시연'})).nickname,'통합시연');
 assert.deepEqual(await api.saveGuardian({name:' 보호자 ',phone:'010-1234-5678'}),{name:'보호자',phone:'01012345678'});
 await api.deleteGuardian();assert.equal((await api.getMe()).guardian,null);
});
test('Mock login returns a token without contacting a backend',async()=>{
 const api=await load('src/api/authApi.ts',`const USE_MOCK={auth:true};const mockResolve=async x=>x;const api={post:()=>{throw Error('network forbidden')}};\n`);
 const result=await api.login({loginId:'integration-demo',password:'synthetic-only'});assert.equal(result.user.loginId,'integration-demo');assert.ok(result.accessToken.length>0);
});
