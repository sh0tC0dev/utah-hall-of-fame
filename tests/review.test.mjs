import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { ReviewService, newIdentity, validateAnchor, RETENTION_WINDOW, PURGE_GRACE, PURGE_SCAN_MAX, PIN_REQUEST_FLOOR } from '../src/lib/review/service.ts';
import { KIT_VERSION } from '../src/lib/review/version.ts';
import { BATCH_FILES_MAX_BYTES, FILES_PER_NOTE, FILE_MAX_BYTES, formatBytes } from '../src/lib/review/files.ts';
// The real Blob store stamps every object's uploadedAt at its last write and
// exposes list/del; this double mirrors that from the same injectable clock the
// service uses, so a fake-clock test can age objects and watch the sweep. The
// pathnames follow the real store's shapes (<key>.json, images/<key>.jpg,
// files/<key>) so del reverses what list returns.
class MemoryStore {
  values=new Map(); images=new Map(); files=new Map(); uploaded=new Map(); queue=Promise.resolve();
  lastListLimit=undefined; failList=false;
  constructor(now=Date.now){ this.now=now }
  async read(k){return structuredClone(this.values.get(k)??null)}
  async change(k,initial,update){
    const work=this.queue.then(()=>{const value=structuredClone(this.values.get(k)??initial());const result=update(value);this.values.set(k,value);this.uploaded.set(k+'.json',this.now());return structuredClone(result)});
    this.queue=work.catch(()=>{});return work;
  }
  async image(k,v){this.images.set(k,v);this.uploaded.set('images/'+k+'.jpg',this.now())} async getImage(k){return this.images.get(k)||null}
  async putFile(k,bytes,contentType){this.files.set(k,{bytes,contentType});this.uploaded.set('files/'+k,this.now())} async getFile(k){return this.files.get(k)||null}
  // Mirrors the real store: one bounded page plus hasMore, which is true when the
  // page did not carry every object under the prefix (limit is a maximum).
  async list(limit){this.lastListLimit=limit;if(this.failList)throw new Error('list unavailable');const all=[...this.uploaded];const page=all.slice(0,limit);return {blobs:page.map(([pathname,uploadedAt])=>({pathname,uploadedAt})),hasMore:all.length>page.length}}
  async del(pathnames){for(const p of pathnames){this.uploaded.delete(p);if(p.startsWith('images/'))this.images.delete(p.slice(7,-4));else if(p.startsWith('files/'))this.files.delete(p.slice(6));else if(p.endsWith('.json'))this.values.delete(p.slice(0,-5))}}
}
// Real bytes, because inspectFile decides a file's kind from its content and
// never from the name the browser sends.
const PNG=new Uint8Array(await sharp({create:{width:1,height:1,channels:4,background:{r:214,g:11,b:39,alpha:1}}}).png().toBuffer());
const PDF=new Uint8Array(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'));
const anchor={selector:'#hero img',tag:'img',image:'/image.jpg',alt:'HVAC technician',text:'',x:.5,y:.4,pageX:400,pageY:500,rect:{x:100,y:100,width:600,height:600},viewport:{width:1440,height:900,dpr:2,scrollX:0,scrollY:100},slide:'websites',url:'/services/hvac-seo',title:'SEO',browser:'QA',version:'test'};
function setup(){
  let now=Date.now();const store=new MemoryStore(()=>now),deliveries=[],accepted=new Map();let fail=false;
  const mail=async(message,key)=>{if(fail)throw Error('Transport unavailable');if(!accepted.has(key)){accepted.set(key,'mail-'+accepted.size);deliveries.push({message,key})}return accepted.get(key)};
  const config={siteName:'Example Client',repository:'https://github.com/example/client',secret:'s'.repeat(64),reviewers:['sos@example.test','second@example.test','third@example.test','fourth@example.test','fifth@example.test'],owner:'jon@example.test',from:'review@example.test',intake:'atlas@example.test',siteUrl:'https://site.example.test'};
  // The PIN request floor is a real timer by default; the suite's clock is fake, so
  // the wait returns at once here and the floor is measured in its own test.
  // Listed work runs beside the floor (0.5.2); the fake floor awaits it, so a
  // test sees its mail delivered when the call resolves.
  const pending=[];const service=new ReviewService(store,mail,config,()=>now,()=>new Promise(resolve=>setTimeout(()=>Promise.all(pending.splice(0)).then(()=>resolve(),()=>resolve()),0)),work=>{pending.push(work)});const id=newIdentity();
  return {service,store,id,deliveries,advance(ms){now+=ms},fail(value){fail=value},async login(email='sos@example.test'){await service.requestPin(id,'1.2.3.4',email);const pin=deliveries.at(-1).message.text.match(/code is (\d{6})/)[1];await service.verify(id,pin);return pin}};
}
test('the PIN goes to the requesting reviewer and copies the owner; anonymous access fails',async()=>{const f=setup();await assert.rejects(()=>f.service.workspace(f.id),{status:401});await f.login();assert.deepEqual(f.deliveries[0].message.to,['sos@example.test']);assert.deepEqual(f.deliveries[0].message.bcc,['jon@example.test']);assert.equal((await f.service.workspace(f.id)).notes.length,0);await f.service.requestPin(newIdentity(),'ip-2','second@example.test');assert.deepEqual(f.deliveries[1].message.to,['second@example.test']);assert.deepEqual(f.deliveries[1].message.bcc,['jon@example.test'])});
test('a reviewer who is also the owner is not blind-copied their own code',async()=>{const f=setup();f.service.config.reviewers=[...f.service.config.reviewers,'jon@example.test'];await f.service.requestPin(f.id,'ip','jon@example.test');assert.deepEqual(f.deliveries[0].message.to,['jon@example.test']);assert.equal(f.deliveries[0].message.bcc,undefined)});
test('PIN is single-use and bound to requesting browser',async()=>{const f=setup();await f.service.requestPin(f.id,'ip','sos@example.test');const pin=f.deliveries[0].message.text.match(/code is (\d{6})/)[1];await assert.rejects(()=>f.service.verify(newIdentity(),pin),{status:401});await f.service.verify(f.id,pin);await assert.rejects(()=>f.service.verify(f.id,pin),{status:401})});
test('PIN expires after ten minutes',async()=>{const f=setup();await f.service.requestPin(f.id,'ip','sos@example.test');const pin=f.deliveries[0].message.text.match(/code is (\d{6})/)[1];f.advance(600001);await assert.rejects(()=>f.service.verify(f.id,pin),{status:401})});
test('five wrong attempts lock challenge, including concurrent guesses',async()=>{const f=setup();await f.service.requestPin(f.id,'ip','sos@example.test');const pin=f.deliveries[0].message.text.match(/code is (\d{6})/)[1];const wrong=pin==='000000'?'000001':'000000';await Promise.allSettled(Array.from({length:8},()=>f.service.verify(f.id,wrong)));await assert.rejects(()=>f.service.verify(f.id,pin),{status:401})});
// A refused request answers exactly like a sent one (from 0.5.2): a 429 told
// the caller the address was listed, because only a listed request fills a
// ceiling. The limits still hold, silently: no mail goes out. Fifteen
// deliveries per IP per hour, because an office shares
// one connection; each to the address that asked, with the owner in bcc, each
// under its own idempotency key. The fifteen are spread five each over three
// addresses so the per-reviewer five is never the cap that fires here.
test('request cooldown and per-IP limit prevent repeated mail, and a refusal answers like a send',async()=>{const f=setup();await f.service.requestPin(f.id,'ip','sos@example.test');assert.equal(f.deliveries.length,1);await f.service.requestPin(f.id,'ip','sos@example.test');assert.equal(f.deliveries.length,1);for(const address of ['sos@example.test','second@example.test','third@example.test'])for(let i=address==='sos@example.test'?1:0;i<5;i++)await f.service.requestPin(newIdentity(),'ip',address);assert.equal(f.deliveries.length,15);await f.service.requestPin(newIdentity(),'ip','fourth@example.test');assert.equal(f.deliveries.length,15);await f.service.requestPin(newIdentity(),'other-ip','fourth@example.test');assert.equal(f.deliveries.length,16);for(const d of f.deliveries){assert.deepEqual(d.message.bcc,['jon@example.test']);assert.equal(d.message.subject,'Example Client: review access code');assert.match(d.message.text,/code is \d{6}\./);assert.match(d.key,/^review-pin\//)}assert.equal(new Set(f.deliveries.map(d=>d.key)).size,16)});
// Each cap below is built so the cap it names is the only one that can fire.
// Every request uses a fresh identity, since the per-browser cooldown is 60s.
test('a reviewer address is capped at five deliveries an hour, and the cap is that address alone',async()=>{const f=setup();const refused=[];for(let i=0;i<6;i++){try{await f.service.requestPin(newIdentity(),'ip-'+i,'sos@example.test')}catch(e){refused.push(e.status)}}assert.deepEqual(refused,[],'the sixth is refused silently');assert.equal(f.deliveries.length,5);await f.service.requestPin(newIdentity(),'ip-6','second@example.test');assert.equal(f.deliveries.length,6);assert.deepEqual(f.deliveries.at(-1).message.to,['second@example.test'])});
test('twenty deliveries an hour is the ceiling across every reviewer and every ip',async()=>{const f=setup();for(const [n,address] of ['sos@example.test','second@example.test','third@example.test','fourth@example.test'].entries())for(let i=0;i<5;i++)await f.service.requestPin(newIdentity(),'ip-'+n,address);assert.equal(f.deliveries.length,20);await f.service.requestPin(newIdentity(),'fresh-ip','fifth@example.test');assert.equal(f.deliveries.length,20)});
// A listed and an unlisted address get the same answer, so the request is no
// free lookup of who reviews the site. Only the listed one is mailed, and the
// unlisted one stops before the store: no challenge, no bucket row, no write.
test('an unlisted address gets the listed answer, is mailed nothing, and touches no store',async()=>{const f=setup();await f.service.requestPin(f.id,'ip','stranger@example.test');assert.equal(f.deliveries.length,0);assert.equal(f.store.values.has('access'),false,'an unlisted request writes no access record');await assert.rejects(()=>f.service.verify(f.id,'123456'),{status:401});await assert.rejects(()=>f.service.workspace(f.id),{status:401});await f.service.requestPin(newIdentity(),'ip',' SOS@Example.test ');assert.equal(f.deliveries.length,1);assert.deepEqual(f.deliveries[0].message.to,['sos@example.test']);const before=JSON.stringify(f.store.values.get('access'));await f.service.requestPin(newIdentity(),'ip','stranger@example.test');assert.equal(JSON.stringify(f.store.values.get('access')),before,'nor does it change one that exists')});
// Junk addresses fill no ceiling: from one browser and one ip, more unlisted
// requests than every ceiling allows are all answered, and a real reviewer on
// that same ip and browser still gets a code.
test('unlisted requests fill no ceiling, so they cannot lock a reviewer out',async()=>{const f=setup();for(let i=0;i<25;i++)await f.service.requestPin(f.id,'office','stranger-'+(i%3)+'@example.test');assert.equal(f.deliveries.length,0);await f.service.requestPin(f.id,'office','sos@example.test');assert.equal(f.deliveries.length,1,'the reviewer is not refused')});
// An unlisted address meets every ceiling listed requests have filled and, like
// a listed one, is refused silently. It still writes nothing.
test('an unlisted address meets the cooldown, per-ip and overall ceilings listed requests filled, and both answer alike',async()=>{const f=setup();await f.service.requestPin(f.id,'ip-a','sos@example.test');const before=JSON.stringify(f.store.values.get('access'));await f.service.requestPin(f.id,'ip-a','stranger@example.test');assert.equal(JSON.stringify(f.store.values.get('access')),before,'and writes nothing');const g=setup();for(const address of ['sos@example.test','second@example.test','third@example.test'])for(let i=0;i<5;i++)await g.service.requestPin(newIdentity(),'office',address);await g.service.requestPin(newIdentity(),'office','stranger@example.test');await g.service.requestPin(newIdentity(),'elsewhere','stranger@example.test');const h=setup();for(const [n,address] of ['sos@example.test','second@example.test','third@example.test','fourth@example.test'].entries())for(let i=0;i<5;i++)await h.service.requestPin(newIdentity(),'ip-'+n,address);await h.service.requestPin(newIdentity(),'ip-new','stranger@example.test');assert.equal(f.deliveries.length+g.deliveries.length+h.deliveries.length,1+15+20)});
// A refused request writes nothing, listed or not: a flood of refusals for a
// known address would otherwise jam the compare-and-swap a listed guess needs.
test('a refused PIN request makes no store write',async()=>{const f=setup();let writes=0;const change=f.store.change.bind(f.store);f.store.change=(...args)=>{writes++;return change(...args)};for(let i=0;i<5;i++)await f.service.requestPin(newIdentity(),'ip-'+i,'sos@example.test');assert.equal(writes,5,'the positive control: each accepted request writes once');await f.service.requestPin(newIdentity(),'ip-9','sos@example.test');assert.equal(writes,5,'the sixth request writes nothing');const browser=newIdentity();await f.service.requestPin(browser,'ip-b','second@example.test');await f.service.requestPin(browser,'ip-b','second@example.test');await f.service.requestPin(browser,'ip-b','stranger@example.test');assert.equal(writes,6,'neither refusal writes');assert.equal(f.deliveries.length,6)});
// The answer never waits on the work only a listed address costs (0.5.2): here
// the swap and the mail never finish, and a listed, an unlisted and a refused
// request still answer at the floor.
test('a PIN request answers at the floor whatever the listed work does',{timeout:5000},async()=>{const f=setup();for(let i=0;i<5;i++)await f.service.requestPin(newIdentity(),'ip-'+i,'second@example.test');const hang=()=>new Promise(()=>{});const store=Object.assign(Object.create(Object.getPrototypeOf(f.store)),f.store);store.change=hang;const s=new ReviewService(store,hang,f.service.config,f.service.now,async ms=>{f.advance(ms)});const took=async(email)=>{const start=s.now();await s.requestPin(newIdentity(),'ip-x',email);return s.now()-start};assert.equal(await took('sos@example.test'),PIN_REQUEST_FLOOR,'listed, work never finishes');assert.equal(await took('stranger@example.test'),PIN_REQUEST_FLOOR,'unlisted');assert.equal(await took('second@example.test'),PIN_REQUEST_FLOOR,'refused by the per-address five')});
// A store that fails only matters on the listed path (only it writes); the
// answer must not show it.
test('a store failure on the listed path answers like the unlisted path',async()=>{const f=setup();const change=f.store.change.bind(f.store);f.store.change=async()=>{throw new Error('BlobServiceNotAvailable')};await f.service.requestPin(f.id,'ip','sos@example.test');assert.equal(f.deliveries.length,0);f.store.change=change;const browser=newIdentity();await f.service.requestPin(browser,'ip-2','second@example.test');assert.equal(f.deliveries.length,1);f.store.change=async()=>{throw new Error('BlobServiceNotAvailable')};await assert.rejects(()=>f.service.verify(browser,'000000'),{status:401});await assert.rejects(()=>f.service.verify(newIdentity(),'000000'),{status:401})});
// The follow-up probe 0.5.1 left open: ask for an address, then for a junk one
// from the same browser. A listed first address set this browser's cooldown,
// an unlisted one did not; the two follow-ups must still answer alike.
test('a follow-up request cannot tell a listed first address from an unlisted one',async()=>{const f=setup();const answers=[];for(const first of ['sos@example.test','stranger@example.test']){const browser=newIdentity();answers.push(await f.service.requestPin(browser,'ip-'+first,first).then(()=>'ok',e=>e.status));answers.push(await f.service.requestPin(browser,'ip-'+first,'junk@example.test').then(()=>'ok',e=>e.status))}assert.deepEqual(answers,['ok','ok','ok','ok']);assert.equal(f.deliveries.length,1,'only the listed first address was mailed')});
// Two requests from one browser at once both pass the first read; the swap
// admits one and refuses the other, which must answer like a send too.
test('a request refused inside the swap answers like a send',async()=>{const f=setup();const browser=newIdentity();const answers=await Promise.all([0,1].map(()=>f.service.requestPin(browser,'ip','sos@example.test').then(()=>'ok',e=>e.status)));assert.deepEqual(answers,['ok','ok']);assert.equal(f.deliveries.length,1,'the swap admitted one')});
// A failed code email answers like a sent one: a 502 for a listed address alone
// would name it. The reviewer sees no code and asks again after the cooldown.
test('a failed code email answers like a sent one',async()=>{const f=setup();f.fail(true);await f.service.requestPin(f.id,'ip','sos@example.test');assert.equal(f.deliveries.length,0);f.fail(false);f.advance(60001);await f.service.requestPin(f.id,'ip','sos@example.test');assert.equal(f.deliveries.length,1,'the next request after the cooldown is mailed')});
// A wrong PIN costs a read plus a read-and-write after a listed request and a
// single read after an unlisted one. One floor timer, started when the check
// arrives, is the only wait on either path: a second wait(0) after a late swap
// cost a timer tick the unlisted path never paid (review round 3).
test('a wrong PIN waits on one floor timer, the same, after a listed or an unlisted request',async()=>{const f=setup();const waits=[];const s=new ReviewService(f.store,async()=>'mail-id',f.service.config,f.service.now,ms=>{waits.push(ms);return new Promise(r=>setTimeout(r,0))});const check=async email=>{const browser=newIdentity();await f.service.requestPin(browser,'ip-'+email,email);waits.length=0;await assert.rejects(()=>s.verify(browser,'000000'),{status:401});return [...waits]};assert.deepEqual(await check('sos@example.test'),[PIN_REQUEST_FLOOR],'after a listed request');assert.deepEqual(await check('stranger@example.test'),[PIN_REQUEST_FLOOR],'after an unlisted request')});
// Next's after() throws when the platform has no waitUntil; only the listed
// path defers, so a throwing defer must not change the answer.
test('a defer that throws answers like the unlisted path',async()=>{const f=setup();const s=new ReviewService(f.store,f.service.mail,f.service.config,f.service.now,()=>Promise.resolve(),()=>{throw new Error('waitUntil is not available')});await s.requestPin(newIdentity(),'ip','sos@example.test');await s.requestPin(newIdentity(),'ip','stranger@example.test');const browser=newIdentity();await f.service.requestPin(browser,'ip-2','second@example.test');await assert.rejects(()=>s.verify(browser,'000000'),{status:401});await assert.rejects(()=>s.verify(newIdentity(),'000000'),{status:401})});
test('the session carries the reviewer, and a fresh login in the same browser replaces it',async()=>{const f=setup();await f.login();assert.equal((await f.service.workspace(f.id)).reviewer,'sos@example.test');await f.service.logout(f.id);f.advance(60001);await f.login('second@example.test');assert.equal((await f.service.workspace(f.id)).reviewer,'second@example.test')});
// A host upgrading from 0.2.0 has sessions stored as a bare expiry number.
// They carry no reviewer, so they are treated as absent: a re-PIN, not a crash.
test('a session stored by an earlier version is refused and a fresh login works',async()=>{const f=setup();await f.login();f.store.values.get('access').sessions[f.service.owner(f.id)]=f.service.now()+86400000;await assert.rejects(()=>f.service.workspace(f.id),{status:401});f.advance(60001);await f.login();assert.equal((await f.service.workspace(f.id)).reviewer,'sos@example.test')});
test('notes persist across service instances; optimistic revision rejects stale edits',async()=>{const f=setup();await f.login();const w=await f.service.save(f.id,0,{comment:'Change image',anchor});assert.equal(w.notes.length,1);const second=new ReviewService(f.store,async()=>'',f.service.config);assert.equal((await second.workspace(f.id)).notes[0].comment,'Change image');await assert.rejects(()=>f.service.save(f.id,0,{comment:'stale',anchor}),{status:409});assert.equal((await f.service.workspace(f.id)).notes.length,1)});
test('editing and removal update the count; draft does not email',async()=>{const f=setup();await f.login();let w=await f.service.save(f.id,0,{comment:'First',anchor});w=await f.service.save(f.id,w.revision,{id:w.notes[0].id,comment:'Edited',anchor});assert.equal(w.notes[0].comment,'Edited');assert.equal(f.deliveries.length,1);w=await f.service.remove(f.id,w.revision,w.notes[0].id);assert.equal(w.notes.length,0)});
test('failed send retains frozen batch; retries and simultaneous sends deliver only once',async()=>{const f=setup();await f.login();const w=await f.service.save(f.id,0,{comment:'Update title',anchor});f.fail(true);await assert.rejects(()=>f.service.send(f.id,w.revision));let saved=await f.service.workspace(f.id);assert.equal(saved.notes.length,1);assert(saved.pending);await assert.rejects(()=>f.service.remove(f.id,saved.revision,saved.notes[0].id),{status:409});f.fail(false);const [a,b]=await Promise.all([f.service.send(f.id,saved.revision),f.service.send(f.id,saved.revision)]);assert.equal(a.id,b.id);saved=await f.service.workspace(f.id);assert.equal(saved.notes.length,0);assert.equal(saved.batches.length,1);await f.service.send(f.id,saved.revision);assert.equal(f.deliveries.filter(d=>d.key.startsWith('review-batch/')).length,1);const sent=f.deliveries.at(-1).message;assert.deepEqual(sent.to,['atlas@example.test']);assert.deepEqual(sent.cc,['jon@example.test']);assert.match(sent.text,/1440 × 900/);assert.match(sent.text,/#batch=/)});
test('uncertain sends stop retrying before provider idempotency expires',async()=>{const f=setup();await f.login();const w=await f.service.save(f.id,0,{comment:'Update',anchor});f.fail(true);await assert.rejects(()=>f.service.send(f.id,w.revision));f.advance(23*3600000+1);f.fail(false);await assert.rejects(()=>f.service.send(f.id,w.revision),{status:409});assert.equal(f.deliveries.length,1)});
test('read-only batch links require the matching unguessable key',async()=>{const f=setup();await f.login();const w=await f.service.save(f.id,0,{comment:'Update',anchor});const b=await f.service.send(f.id,w.revision);await assert.rejects(()=>f.service.readBatch(b.id,'wrong'),{status:403});assert.equal((await f.service.readBatch(b.id,f.service.batchKey(b.id))).notes[0].comment,'Update')});
test('logout revokes access without deleting saved draft',async()=>{const f=setup();await f.login();await f.service.save(f.id,0,{comment:'Keep',anchor});await f.service.logout(f.id);await assert.rejects(()=>f.service.workspace(f.id),{status:401});f.advance(60001);await f.login();assert.equal((await f.service.workspace(f.id)).notes[0].comment,'Keep')});
test('external destinations and overlong comments are rejected',async()=>{assert.throws(()=>validateAnchor({...anchor,url:'//evil.test/'}));const f=setup();await f.login();await assert.rejects(()=>f.service.save(f.id,0,{comment:'x'.repeat(4001),anchor}));assert.equal((await f.service.workspace(f.id)).notes.length,0)});

test('Atlas package preserves exact text, reviewed origin/build and screenshot mapping',async()=>{const f=setup();await f.login();f.service.config.siteUrl='http://127.0.0.1:3044';await f.store.image('qa-image',new Uint8Array([1,2,3]));const comment='  Replace this photo.\nUse the approved portrait.  ';const w=await f.service.save(f.id,0,{comment,anchor:{...anchor,origin:'http://127.0.0.1:3044',fragment:'#team',version:'abc123:source-deadbeef',image:'/images/team/ron-pink.jpg'},asset:'qa-image'});await f.service.send(f.id,w.revision);const email=f.deliveries.at(-1).message;const manifest=JSON.parse(Buffer.from(email.attachments.find(a=>a.filename==='changes.json').content,'base64').toString());assert.match(manifest.reportUrl,/^http:\/\/127\.0\.0\.1:3044\/review#batch=/);const c=manifest.changes[0];assert.equal(c.comment,comment);assert.equal(c.pageUrl,'http://127.0.0.1:3044/services/hvac-seo#team');assert.equal(c.reviewedBuild,'abc123:source-deadbeef');assert.equal(c.environment,'local');assert.equal(c.originalImageUrl,'http://127.0.0.1:3044/images/team/ron-pink.jpg');assert.equal(c.screenshot,'change-1.jpg');assert.equal(c.id,w.notes[0].id);assert.match(email.text,/Screenshot: change-1.jpg/);assert.equal(manifest.batchId,(await f.service.workspace(f.id)).batches[0].id);assert.equal(manifest.kitVersion,KIT_VERSION);assert.equal(email.text.split('\n').at(-1),`Sent by ShotCo Review ${KIT_VERSION}`);assert.equal(email.subject,`Example Client: 1 website change [${manifest.batchId.slice(0,8)}]`)});
// The subject counts its changes in English; the manifest and the footer line
// carry the kit version whatever the count.
test('batch subject pluralises and every batch carries the kit version',async()=>{const f=setup();await f.login();let w=await f.service.save(f.id,0,{comment:'One',anchor});w=await f.service.save(f.id,w.revision,{comment:'Two',anchor});const b=await f.service.send(f.id,w.revision);const email=f.deliveries.at(-1).message;assert.equal(email.subject,`Example Client: 2 website changes [${b.id.slice(0,8)}]`);assert.match(email.text,new RegExp(`\\nSent by ShotCo Review ${KIT_VERSION.replace(/\./g,'\\.')}$`));const manifest=JSON.parse(Buffer.from(email.attachments.find(a=>a.filename==='changes.json').content,'base64').toString());assert.equal(manifest.kitVersion,KIT_VERSION);assert.equal(manifest.schemaVersion,1)});


test('sessions expire and separate browsers cannot read each other’s drafts',async()=>{const f=setup();await f.login();await f.service.save(f.id,0,{comment:'Private',anchor});await assert.rejects(()=>f.service.workspace(newIdentity()),{status:401});f.advance(14*86400000+1);await assert.rejects(()=>f.service.workspace(f.id),{status:401})});
test('malformed Unicode batch keys are rejected rather than crashing the comparison',async()=>{const f=setup();await assert.rejects(()=>f.service.readBatch('11111111-1111-1111-1111-111111111111','é'.repeat(64)),{status:403})});
test('unknown browser verification and logout do not mutate access storage',async()=>{const f=setup();await assert.rejects(()=>f.service.verify(f.id,'123456'),{status:401});await assert.rejects(()=>f.service.logout(f.id),{status:401});assert.equal(f.store.values.size,0)});
test('client identity is configured and frozen across a failed-send retry',async()=>{const f=setup();await f.login();assert.match(f.deliveries[0].message.subject,/Example Client/);const w=await f.service.save(f.id,0,{comment:'Change the heading',anchor});f.fail(true);await assert.rejects(()=>f.service.send(f.id,w.revision));f.service.config.siteName='Other Client';f.service.config.repository='https://github.com/example/other';f.fail(false);await f.service.send(f.id,w.revision);const message=f.deliveries.at(-1).message;assert.match(message.subject,/Example Client/);const manifest=JSON.parse(Buffer.from(message.attachments.find(a=>a.filename==='changes.json').content,'base64').toString());assert.equal(manifest.project,'Example Client');assert.equal(manifest.repository,'https://github.com/example/client');assert.doesNotMatch(message.text,/Select On Site/)});
// Reply-To, the email's Reviewer line and the manifest all name the session
// that pressed Send, so a reply from Atlas reaches the person who asked.
test('the batch names the submitting reviewer in reply_to, the email and the manifest',async()=>{const f=setup();await f.login();const w=await f.service.save(f.id,0,{comment:'Change the heading',anchor});const b=await f.service.send(f.id,w.revision);assert.equal(b.reviewer,'sos@example.test');const email=f.deliveries.at(-1).message;assert.equal(email.reply_to,'sos@example.test');assert.match(email.text,/\nRepository: https:\/\/github\.com\/example\/client\nReviewer: sos@example\.test\n/);const manifest=JSON.parse(Buffer.from(email.attachments.find(a=>a.filename==='changes.json').content,'base64').toString());assert.equal(manifest.reviewer,'sos@example.test');const second=newIdentity();await f.service.requestPin(second,'ip-2','second@example.test');await f.service.verify(second,f.deliveries.at(-1).message.text.match(/code is (\d{6})/)[1]);const w2=await f.service.save(second,0,{comment:'A second reviewer change',anchor});const b2=await f.service.send(second,w2.revision);assert.equal(b2.reviewer,'second@example.test');assert.equal(f.deliveries.at(-1).message.reply_to,'second@example.test');assert.match(f.deliveries.at(-1).message.text,/\nReviewer: second@example\.test\n/)});

// Attachments. Every fixture is real bytes: the service decides a file's kind
// from its content, and the ledger, not the request, decides its metadata.
const manifestOf=email=>JSON.parse(Buffer.from(email.attachments.find(a=>a.filename==='changes.json').content,'base64').toString());
test('attach stores the file, lists it as a pending upload, and leaves the revision alone',async()=>{const f=setup();await f.login();const before=(await f.service.workspace(f.id)).revision;const a=await f.service.attach(f.id,{name:'My Logo.png',bytes:PNG});assert.match(a.id,/^[a-f0-9-]{36}$/);assert.equal(a.name,'My Logo.png');assert.equal(a.type,'image/png');assert.ok(a.size>0);const stored=f.store.files.get(a.id);assert.equal(stored.contentType,'image/png');assert.equal(stored.bytes.length,a.size);const w=await f.service.workspace(f.id);assert.equal(w.revision,before);assert.deepEqual(w.uploads.map(u=>u.id),[a.id]);assert.equal(w.uploads[0].name,'My Logo.png');assert.equal(w.uploads[0].createdAt,f.service.now())});
// The name a browser sends is a suggestion; the extension follows the bytes.
test('attach names the file from its detected kind, whatever the browser called it',async()=>{const f=setup();await f.login();const a=await f.service.attach(f.id,{name:'../../etc/payload.exe',bytes:PDF});assert.equal(a.name,'payload.pdf');assert.equal(a.type,'application/pdf');assert.deepEqual(f.store.files.get(a.id).bytes,PDF)});
test('attach refuses an oversized file, a kind it does not take, and the upload past the pending cap',async()=>{const f=setup();await f.login();await assert.rejects(()=>f.service.attach(f.id,{name:'huge.png',bytes:new Uint8Array(FILE_MAX_BYTES+1)}),{status:413,message:/3 MB/});assert.equal(f.store.files.size,0);await assert.rejects(()=>f.service.attach(f.id,{name:'notes.txt',bytes:new Uint8Array(Buffer.from('A plain text note, not a file we take.'))}),{status:415,message:/JPEG, PNG, WebP or PDF/});assert.equal(f.store.files.size,0);for(let i=0;i<20;i++)await f.service.attach(f.id,{name:`f${i}.pdf`,bytes:PDF});assert.equal((await f.service.workspace(f.id)).uploads.length,20);await assert.rejects(()=>f.service.attach(f.id,{name:'one-too-many.pdf',bytes:PDF}),{status:409});assert.equal((await f.service.workspace(f.id)).uploads.length,20);assert.equal(f.store.files.size,20)});
test('save takes only ids this browser uploaded, and copies their metadata from the ledger',async()=>{const f=setup();await f.login();await assert.rejects(()=>f.service.save(f.id,0,{comment:'Use this',anchor,attachments:[{id:'11111111-1111-1111-1111-111111111111'}]}),{status:409,message:/not available/});assert.equal((await f.service.workspace(f.id)).notes.length,0);const a=await f.service.attach(f.id,{name:'logo.png',bytes:PNG});const w=await f.service.save(f.id,0,{comment:'Use this',anchor,attachments:[{id:a.id,name:'invoice.html',type:'text/html',size:99999}]});assert.deepEqual(w.notes[0].attachments,[{id:a.id,name:'logo.png',type:'image/png',size:a.size}]);assert.deepEqual(w.uploads,[])});
// A save that omits the attachments key is an edit of the comment alone: the
// change keeps the files it already carries, and their objects stay pointed at.
test('editing a change without naming its attachments keeps them',async()=>{const f=setup();await f.login();const up=await f.service.attach(f.id,{name:'keep.pdf',bytes:PDF});let w=await f.service.save(f.id,0,{comment:'With a file',anchor,attachments:[{id:up.id}]});assert.equal(w.notes[0].attachments.length,1);w=await f.service.save(f.id,w.revision,{id:w.notes[0].id,comment:'Comment edited',anchor});assert.equal(w.notes[0].comment,'Comment edited');assert.deepEqual(w.notes[0].attachments,[{id:up.id,name:'keep.pdf',type:'application/pdf',size:PDF.length}])});
test('a change carries at most five files',async()=>{const f=setup();await f.login();const ids=[];for(let i=0;i<FILES_PER_NOTE+1;i++)ids.push((await f.service.attach(f.id,{name:`f${i}.pdf`,bytes:PDF})).id);await assert.rejects(()=>f.service.save(f.id,0,{comment:'Too many',anchor,attachments:ids.map(id=>({id}))}),{status:409,message:/up to 5 files/});assert.equal((await f.service.workspace(f.id)).notes.length,0);const w=await f.service.save(f.id,0,{comment:'Just enough',anchor,attachments:ids.slice(0,FILES_PER_NOTE).map(id=>({id}))});assert.equal(w.notes[0].attachments.length,FILES_PER_NOTE)});
// Editing a change reads its own attachments back, which is the only place a
// file is available without a ledger entry; a file dropped from a change is
// gone from both, so it cannot be put back without uploading it again.
test('editing a change keeps a file already on it, and a dropped file cannot return',async()=>{const f=setup();await f.login();const a=await f.service.attach(f.id,{name:'a.pdf',bytes:PDF});const b=await f.service.attach(f.id,{name:'b.pdf',bytes:PDF});let w=await f.service.save(f.id,0,{comment:'Two files',anchor,attachments:[{id:a.id},{id:b.id}]});const noteId=w.notes[0].id;assert.deepEqual(w.uploads,[]);w=await f.service.save(f.id,w.revision,{id:noteId,comment:'One file',anchor,attachments:[{id:a.id}]});assert.deepEqual(w.notes[0].attachments.map(x=>x.name),['a.pdf']);w=await f.service.save(f.id,w.revision,{id:noteId,comment:'No files',anchor,attachments:[]});assert.deepEqual(w.notes[0].attachments,[]);await assert.rejects(()=>f.service.save(f.id,w.revision,{id:noteId,comment:'Back again',anchor,attachments:[{id:b.id}]}),{status:409})});
test('a pending upload older than a day is pruned at the next attach',async()=>{const f=setup();await f.login();const stale=await f.service.attach(f.id,{name:'stale.pdf',bytes:PDF});f.advance(86400001);const fresh=await f.service.attach(f.id,{name:'fresh.pdf',bytes:PDF});assert.deepEqual((await f.service.workspace(f.id)).uploads.map(u=>u.id),[fresh.id]);await assert.rejects(()=>f.service.save(f.id,0,{comment:'Stale',anchor,attachments:[{id:stale.id}]}),{status:409})});
test('a sent batch carries each file under a unique name, in the text and in the manifest',async()=>{const f=setup();await f.login();const a=await f.service.attach(f.id,{name:'My Logo.png',bytes:PNG});let w=await f.service.save(f.id,0,{comment:'Use this logo',anchor,attachments:[{id:a.id}]});w=await f.service.save(f.id,w.revision,{comment:'Nothing attached here',anchor});await f.service.send(f.id,w.revision);const email=f.deliveries.at(-1).message;const filename=`change-1-file-1-${a.name}`;const sent=email.attachments.find(x=>x.filename===filename);assert.ok(sent,email.attachments.map(x=>x.filename).join(', '));assert.deepEqual(new Uint8Array(Buffer.from(sent.content,'base64')),f.store.files.get(a.id).bytes);assert.ok(email.text.includes(`\nAttachments: ${filename} (image/png, ${formatBytes(a.size)})\n`),email.text);assert.ok(email.text.includes('\nAttachments: none\n'),email.text);const manifest=manifestOf(email);assert.deepEqual(manifest.changes[0].attachments,[{id:a.id,name:'My Logo.png',filename,type:'image/png',size:a.size}]);assert.deepEqual(manifest.changes[1].attachments,[]);assert.equal(manifest.schemaVersion,1);const report=await f.service.readBatch(manifest.batchId,f.service.batchKey(manifest.batchId));assert.deepEqual(report.notes[0].attachments,[{id:a.id,name:'My Logo.png',type:'image/png',size:a.size}])});
// The sizes are set in the store so the fixture stays a few hundred bytes. The
// refusal happens inside the freeze, so nothing is frozen and nothing is mailed.
test('a batch carrying more than the attachment limit is refused before it is frozen',async()=>{const f=setup();await f.login();const a=await f.service.attach(f.id,{name:'big.pdf',bytes:PDF});const w=await f.service.save(f.id,0,{comment:'Heavy batch',anchor,attachments:[{id:a.id}]});f.store.values.get('workspace/'+f.service.owner(f.id)).notes[0].attachments[0].size=BATCH_FILES_MAX_BYTES+1;await assert.rejects(()=>f.service.send(f.id,w.revision),{status:413,message:/the limit is 20 MB/});const after=await f.service.workspace(f.id);assert.equal(after.pending,undefined);assert.equal(after.revision,w.revision);assert.equal(f.deliveries.filter(d=>d.key.startsWith('review-batch/')).length,0)});
test('a file missing from storage at send time is named in the email and null in the manifest',async()=>{const f=setup();await f.login();const a=await f.service.attach(f.id,{name:'gone.pdf',bytes:PDF});const w=await f.service.save(f.id,0,{comment:'Missing file',anchor,attachments:[{id:a.id}]});f.store.files.delete(a.id);await f.service.send(f.id,w.revision);const email=f.deliveries.at(-1).message;assert.ok(email.text.includes('\nAttachments: gone.pdf (file missing)\n'),email.text);assert.equal(email.attachments.filter(x=>x.filename.startsWith('change-1-file-')).length,0);const entry=manifestOf(email).changes[0].attachments[0];assert.equal(entry.filename,null);assert.equal(entry.name,'gone.pdf');assert.equal(entry.id,a.id)});

// Retention sweep. The store double ages objects on the same fake clock the
// service reads, so the boundary is exact and no real time passes.
test('the retention sweep deletes an object only once it is past the window plus the grace', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Keep for ninety days', anchor });
  const b = await f.service.send(f.id, w.revision);
  const sentAt = f.service.now(); const path = 'batch/' + b.id + '.json';
  // Just inside the window plus grace: nothing is stale, the report survives.
  f.advance(RETENTION_WINDOW + PURGE_GRACE - 1);
  assert.deepEqual(await f.service.sweep(), []);
  assert.equal(f.store.values.has('batch/' + b.id), true, 'the report survives inside the window plus grace');
  // One millisecond past it: the object is now older than the window plus grace.
  f.advance(2);
  assert.equal(f.service.now() - sentAt, RETENTION_WINDOW + PURGE_GRACE + 1);
  const swept = await f.service.sweep();
  assert.ok(swept.includes(path), `${path} should be swept; swept ${JSON.stringify(swept)}`);
  assert.equal(f.store.values.has('batch/' + b.id), false, 'the aged report is gone');
});
// Rule 3: workspace/ and access are never swept, even aged and idle. They are
// bounded (one per owner, one per site) so there is no storage case, and
// sweeping them would cost a reviewer's unsent draft and a live session. This
// ages everything and writes nothing after, so only the exclusion itself, not
// an active-write refresh of uploadedAt, can spare them.
test('the retention sweep never touches workspace or access, even when aged and idle', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'A change', anchor });
  const b = await f.service.send(f.id, w.revision);
  const owner = f.service.owner(f.id);
  // Long past the window and grace for everything, and nothing is written after.
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  const swept = await f.service.sweep();
  assert.ok(swept.includes('batch/' + b.id + '.json'), 'the aged report is swept');
  assert.equal(swept.some(p => p.startsWith('workspace/') || p.startsWith('access')), false, 'no workspace or access object is swept');
  assert.equal(f.store.values.has('workspace/' + owner), true, 'the idle workspace survives');
  assert.equal(f.store.values.has('access'), true, 'the idle access record survives');
});
// Per report, not per object: a report's screenshots and attached files die
// WITH the report, at its expiry plus the grace, whatever their own capture
// time. Defect B: a draft that sat past the window before it was sent has
// assets already older than the sweep cutoff, yet the live report keeps them; a
// per-object sweep would delete them under the client.
test('a report keeps its assets while it is live, and they are deleted with it', async () => {
  const f = setup(); await f.login();
  const a = await f.service.attach(f.id, { name: 'flyer.pdf', bytes: PDF });
  const assetKey = '44444444-4444-4444-4444-444444444444';
  await f.store.image(assetKey, PNG);
  const w = await f.service.save(f.id, 0, { comment: 'With assets', anchor, asset: assetKey, attachments: [{ id: a.id }] });
  // The draft sits past the window plus grace before it is sent, so both asset
  // objects are already older than the sweep cutoff at send time. The 14-day
  // session lapses over that gap, so the reviewer signs in again to send; the
  // asset objects keep their old uploadedAt.
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  await f.login();
  const b = await f.service.send(f.id, w.revision); // send runs a sweep
  const key = f.service.batchKey(b.id);
  assert.equal((await f.service.readBatch(b.id, key)).notes[0].comment, 'With assets');
  assert.notEqual(await f.store.getImage(assetKey), null, 'the screenshot survives with its live report');
  assert.notEqual(await f.store.getFile(a.id), null, 'the attached file survives with its live report');
  // Age the report itself past its own expiry plus the grace: it and both assets go together.
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  const swept = await f.service.sweep();
  assert.ok(swept.includes('batch/' + b.id + '.json'), 'the batch object is swept');
  assert.ok(swept.includes('images/' + assetKey + '.jpg'), 'the screenshot is swept with it');
  assert.ok(swept.includes('files/' + a.id), 'the attached file is swept with it');
  assert.equal(await f.store.getImage(assetKey), null);
  assert.equal(await f.store.getFile(a.id), null);
});
// The orphan pass deletes an image or file no stored batch references, but only
// on a complete enumeration. A full page may hide the batch that references an
// object on a later page, so the pass refuses rather than read a live report's
// asset as an orphan and delete it.
test('the orphan pass deletes an unreferenced aged object, but refuses when the page filled', async () => {
  const f = setup(); await f.login();
  const orphanKey = '55555555-5555-5555-5555-555555555555';
  f.store.images.set(orphanKey, PNG);
  f.store.uploaded.set('images/' + orphanKey + '.jpg', f.service.now()); // captured now
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1); // the orphan is now past the cutoff
  // Pad the listing to a full page: the enumeration may be truncated, so refuse.
  for (let i = 0; i < PURGE_SCAN_MAX; i++) f.store.uploaded.set('workspace/pad-' + i + '.json', f.service.now());
  assert.equal((await f.store.list(PURGE_SCAN_MAX)).blobs.length, PURGE_SCAN_MAX, 'the page is full');
  assert.equal((await f.service.sweep()).includes('images/' + orphanKey + '.jpg'), false, 'a full page refuses the orphan pass');
  assert.equal(f.store.images.has(orphanKey), true, 'the aged orphan survives an incomplete enumeration');
  // Drop the padding: the enumeration is complete now, and the same aged orphan is swept.
  for (let i = 0; i < PURGE_SCAN_MAX; i++) f.store.uploaded.delete('workspace/pad-' + i + '.json');
  const swept = await f.service.sweep();
  assert.ok(swept.includes('images/' + orphanKey + '.jpg'), 'a complete page sweeps the aged orphan');
  assert.equal(f.store.images.has(orphanKey), false);
});
test('the retention sweep asks the store for only one bounded page', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'One', anchor });
  await f.service.send(f.id, w.revision); // send runs a sweep
  assert.equal(f.store.lastListLimit, PURGE_SCAN_MAX, 'send sweeps with the explicit page cap');
  f.store.lastListLimit = undefined;
  await f.service.sweep();
  assert.equal(f.store.lastListLimit, PURGE_SCAN_MAX, 'a direct sweep uses the same cap');
});
test('a failing retention sweep still returns a successful send', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Deliver me', anchor });
  f.store.failList = true; // the sweep will throw
  const sent = await f.service.send(f.id, w.revision);
  assert.equal(sent.notes[0].comment, 'Deliver me');
  assert.ok(sent.sentAt, 'the batch was sent');
  assert.equal(f.deliveries.filter(d => d.key.startsWith('review-batch/')).length, 1, 'the batch was delivered');
  assert.equal((await f.service.workspace(f.id)).notes.length, 0, 'the workspace moved on as a normal send');
});

// Link expiry, forward-only. A sent report expires the retention window after
// the moment it was sent; readBatch refuses an expired link with 410 Gone.
test('a sent report expires the retention window after send, at the boundary', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Read me', anchor });
  const b = await f.service.send(f.id, w.revision);
  const key = f.service.batchKey(b.id);
  assert.equal(b.expiresAt, b.sentAt + RETENTION_WINDOW, 'expiry is send time plus the retention window');
  // Just inside the window: still readable.
  f.advance(RETENTION_WINDOW - 1);
  assert.equal((await f.service.readBatch(b.id, key)).notes[0].comment, 'Read me');
  // Exactly at the window, the clock has reached expiresAt: 410 Gone.
  f.advance(1);
  await assert.rejects(() => f.service.readBatch(b.id, key), { status: 410, message: /no longer available/ });
  // Past it: still 410.
  f.advance(1);
  await assert.rejects(() => f.service.readBatch(b.id, key), { status: 410 });
});
// Uniform expiry, first branch. A stamped expiresAt is the authority, taken over
// the sentAt fallback even when the two disagree: here a stamp far earlier than
// sentAt + window, so a batch expires at the stamp, not at the fallback.
test('a stamped expiresAt is honoured over the sentAt fallback', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Stamped', anchor });
  const b = await f.service.send(f.id, w.revision);
  const key = f.service.batchKey(b.id);
  const sentAt = b.sentAt;
  f.store.values.get('batch/' + b.id).expiresAt = sentAt + 1000; // far below sentAt + window
  f.advance(999);
  assert.equal((await f.service.readBatch(b.id, key)).notes[0].comment, 'Stamped', 'readable before the stamped expiry');
  f.advance(1); // now at the stamp, still far inside sentAt + window
  await assert.rejects(() => f.service.readBatch(b.id, key), { status: 410 });
});
// Uniform expiry, second branch. A batch stored with no expiresAt (every report
// 0.4.x wrote) still expires, at sentAt plus the window, NOT at createdAt plus
// the window. Here createdAt is set well before sentAt, so the two fallbacks
// disagree and only the sentAt branch keeps the report readable to the boundary.
test('a report with no expiresAt expires at sentAt plus the window, not createdAt', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'No stamp', anchor });
  const b = await f.service.send(f.id, w.revision);
  const key = f.service.batchKey(b.id);
  const sentAt = b.sentAt, record = f.store.values.get('batch/' + b.id);
  delete record.expiresAt;                       // a 0.4.x record: sentAt, no expiresAt
  record.createdAt = sentAt - RETENTION_WINDOW;  // created long before it was sent
  // Past createdAt + window but inside sentAt + window: readable, because the
  // fallback reads sentAt, not createdAt.
  f.advance(RETENTION_WINDOW - 1);
  assert.equal((await f.service.readBatch(b.id, key)).notes[0].comment, 'No stamp');
  // At sentAt + window: 410, the same boundary as a stamped report.
  f.advance(1);
  assert.equal(f.service.now() - sentAt, RETENTION_WINDOW);
  await assert.rejects(() => f.service.readBatch(b.id, key), { status: 410, message: /no longer available/ });
});
// Uniform expiry, third branch. A report saved but never sent (the pre-send
// write that a failed delivery can leave behind) carries neither expiresAt nor
// sentAt, and expires at createdAt plus the window.
test('a report saved but never sent expires at createdAt plus the window', async () => {
  const f = setup(); await f.login();
  const id = '22222222-2222-2222-2222-222222222222', createdAt = f.service.now();
  f.store.values.set('batch/' + id, { packageVersion: 2, id, notes: [{ id: '33333333-3333-3333-3333-333333333333', comment: 'Never sent', anchor, createdAt, capture: '' }], createdAt, from: 'review@example.test', to: 'atlas@example.test', siteUrl: 'https://site.example.test' });
  const key = f.service.batchKey(id);
  f.advance(RETENTION_WINDOW - 1);
  assert.equal((await f.service.readBatch(id, key)).notes[0].comment, 'Never sent', 'readable inside createdAt plus the window');
  f.advance(1);
  await assert.rejects(() => f.service.readBatch(id, key), { status: 410 });
});
// Revocation: any authenticated reviewer of the site may revoke any batch of
// the site, and readBatch then answers the same shared 410.
test('an authenticated reviewer revokes a batch and readBatch then refuses it with the shared 410', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Revoke me', anchor });
  const b = await f.service.send(f.id, w.revision);
  const key = f.service.batchKey(b.id);
  assert.equal((await f.service.readBatch(b.id, key)).notes[0].comment, 'Revoke me', 'readable before revocation');
  const revoked = await f.service.revoke(f.id, b.id);
  assert.equal(revoked.revokedAt, f.service.now(), 'the batch carries the revocation time');
  await assert.rejects(() => f.service.readBatch(b.id, key), { status: 410, message: /no longer available/ });
});
test('revoke needs an authenticated session and a real batch, and leaves an unrevoked batch untouched', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Still live', anchor });
  const b = await f.service.send(f.id, w.revision);
  await assert.rejects(() => f.service.revoke(newIdentity(), b.id), { status: 401 });
  assert.equal((await f.service.readBatch(b.id, f.service.batchKey(b.id))).notes[0].comment, 'Still live', 'an unauthenticated revoke changes nothing');
  await assert.rejects(() => f.service.revoke(f.id, '11111111-1111-1111-1111-111111111111'), { status: 404 });
});
// revoke's id-shape guard runs before the store is ever touched, mirroring the
// 36-character shape check readBatch uses. A malformed, traversal-shaped id is
// refused 400 "Invalid batch ID." and never reaches store.change. The sibling
// test above proves a WELL-SHAPED unknown id is a 404, so deleting the shape
// guard makes the malformed id fall through to that same 404, reddening this
// test alone.
test('revoke refuses a malformed batch id with 400, before it reaches the store', async () => {
  const f = setup(); await f.login();
  await assert.rejects(() => f.service.revoke(f.id, '../x'), { status: 400, message: /Invalid batch ID/ });
});
test('revoking twice succeeds and keeps the first revocation time', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Twice', anchor });
  const b = await f.service.send(f.id, w.revision);
  const first = (await f.service.revoke(f.id, b.id)).revokedAt;
  assert.ok(first);
  f.advance(60000);
  const second = (await f.service.revoke(f.id, b.id)).revokedAt;
  assert.equal(second, first, 'the second revocation does not move the first time');
});
// ORDER IS A SECURITY REQUIREMENT. The id-shape check and the timing-safe key
// comparison run before the expiry and revocation checks, so a caller without
// the correct key gets the existing 403 and cannot probe whether an id exists
// or what state it is in. Only a key holder ever sees a 410, which is why the
// 410 leaks nothing.
test('a wrong key is refused 403 before any state check, so a 410 leaks nothing', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'One', anchor });
  const revokedBatch = await f.service.send(f.id, w.revision);
  await f.service.revoke(f.id, revokedBatch.id);
  // Revoked: the key holder sees the 410, a guesser only ever the 403.
  await assert.rejects(() => f.service.readBatch(revokedBatch.id, f.service.batchKey(revokedBatch.id)), { status: 410 });
  await assert.rejects(() => f.service.readBatch(revokedBatch.id, 'wrong'), { status: 403 });
  // A second, unrevoked batch, then aged past its expiry.
  const w2 = await f.service.save(f.id, (await f.service.workspace(f.id)).revision, { comment: 'Two', anchor });
  const expiredBatch = await f.service.send(f.id, w2.revision);
  f.advance(RETENTION_WINDOW + 1);
  // Expired: same story, the key gates the 410.
  await assert.rejects(() => f.service.readBatch(expiredBatch.id, f.service.batchKey(expiredBatch.id)), { status: 410 });
  await assert.rejects(() => f.service.readBatch(expiredBatch.id, 'wrong'), { status: 403 });
});

// Draft retention (MUST-1). A draft names its assets ONLY inside its workspace
// (notes[].asset, notes[].attachments) and the sweep built `referenced` from
// batch records alone, so the orphan pass deleted an unsent draft's screenshot
// and attached files once they aged, while the note still pointed at them and
// the panel rendered "Snapshot could not load". Built through the real producer:
// attach and save through the service, put the screenshot the way the save route
// does (route.ts stores the image, then references it on the note).
test('an unsent draft keeps its screenshot and files past the window plus the grace', async () => {
  const f = setup(); await f.login();
  const a = await f.service.attach(f.id, { name: 'draft.pdf', bytes: PDF });
  const assetKey = '66666666-6666-6666-6666-666666666666';
  await f.store.image(assetKey, PNG);
  await f.service.save(f.id, 0, { comment: 'A draft never sent', anchor, asset: assetKey, attachments: [{ id: a.id }] });
  // Never sent, so no batch/ record exists: the assets are named only in the
  // workspace. Age everything one ms past the orphan cutoff (window plus grace).
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  const swept = await f.service.sweep();
  assert.equal(swept.some(p => p.startsWith('images/') || p.startsWith('files/')), false, `no draft asset is swept; swept ${JSON.stringify(swept)}`);
  assert.notEqual(await f.store.getImage(assetKey), null, 'the draft screenshot survives past the window, and the getter returns it');
  assert.notEqual(await f.store.getFile(a.id), null, 'the draft attachment survives past the window, and the getter returns it');
});
// An unreadable or unparseable workspace could name a draft's assets, so the
// orphan pass must refuse rather than read one as an orphan and delete it, the
// same refusal a truncated page triggers. Here a workspace is listed but read
// returns null (a raced deletion or a corrupt object): its keep-set is
// unknowable, so an aged, unreferenced orphan is spared.
test('the orphan pass refuses when a workspace cannot be read', async () => {
  const f = setup(); await f.login();
  const orphanKey = '77777777-7777-7777-7777-777777777777';
  f.store.images.set(orphanKey, PNG);
  f.store.uploaded.set('images/' + orphanKey + '.jpg', f.service.now());
  const owner = 'a'.repeat(64);
  f.store.uploaded.set('workspace/' + owner + '.json', f.service.now()); // listed, but no values entry: read returns null
  assert.equal(await f.store.read('workspace/' + owner), null, 'the listed workspace cannot be read');
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  const swept = await f.service.sweep();
  assert.equal(swept.includes('images/' + orphanKey + '.jpg'), false, 'an unreadable workspace refuses the orphan pass');
  assert.equal(f.store.images.has(orphanKey), true, 'the aged orphan survives the refusal');
});
// A just-sent report's batch/ record may not be in the very next list(): Vercel
// documents read-after-write for get(), not for list(), and VALIDATION.md lists
// list-after-put consistency as never exercised. The workspace's `batches` are
// the receipts of the last ten sent reports, so unioning their references keeps
// a just-sent report's assets out of the orphan pass during any such window.
// It cannot keep a swept report's assets alive: the per-report pass dooms them
// with the record, independent of `referenced`.
test('a just-sent report keeps its assets when the listing has not yet surfaced its batch record', async () => {
  const f = setup(); await f.login();
  const a = await f.service.attach(f.id, { name: 'late.pdf', bytes: PDF });
  const assetKey = '88888888-8888-8888-8888-888888888888';
  await f.store.image(assetKey, PNG);
  const w = await f.service.save(f.id, 0, { comment: 'Sent while the listing lags', anchor, asset: assetKey, attachments: [{ id: a.id }] });
  // The draft sat past the window before it was sent, so both asset objects are
  // already older than the orphan cutoff at send time. The session lapses over
  // that gap, so the reviewer signs in again to send.
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  await f.login();
  // The store lists everything EXCEPT the batch record written moments ago.
  const listed = f.store.list.bind(f.store);
  f.store.list = async limit => { const { blobs, hasMore } = await listed(limit); return { blobs: blobs.filter(o => !/(?:^|\/)batch\//.test(o.pathname)), hasMore }; };
  const b = await f.service.send(f.id, w.revision); // send runs a sweep, with the record hidden
  assert.notEqual(await f.store.getImage(assetKey), null, 'the screenshot survives a lagging listing');
  assert.notEqual(await f.store.getFile(a.id), null, 'the attached file survives a lagging listing');
  assert.equal((await f.service.readBatch(b.id, f.service.batchKey(b.id))).notes[0].comment, 'Sent while the listing lags');
});
// Production Gate Finding 2 (blocking): the sweep's batch loop must treat a
// batch/ record it cannot read the way the workspace loop treats an unreadable
// workspace. On the identical condition the workspace loop sets complete = false
// and continues, but the batch loop only continued, leaving complete TRUE, so
// the orphan pass ran on a keep-set missing that report's assets. Driven end to
// end: a screenshot captured, its draft held twenty days then sent, aged to day
// 98 (its image past the 97-day orphan cutoff) while the report is live to day
// 110 and has fallen out of the workspace's ten-receipt window; one null read of
// its batch/ record must not let the orphan pass delete images/<id>.jpg while
// readBatch still answers.
test('an unreadable batch record refuses the orphan pass instead of deleting a live report asset', async () => {
  const DAY = 86_400_000;
  const f = setup(); await f.login();
  const assetKey = '99999999-9999-9999-9999-999999999999';
  await f.store.image(assetKey, PNG); // captured at day 0
  const w = await f.service.save(f.id, 0, { comment: 'Held then sent', anchor, asset: assetKey });
  // Held twenty days before it is sent, so the screenshot object is already
  // twenty days old at send time. The 14-day session lapses over that gap, so
  // the reviewer signs in again to send.
  f.advance(20 * DAY);
  await f.login();
  const b = await f.service.send(f.id, w.revision); // sentAt day 20, expiresAt day 110
  // The report has aged out of the workspace's ten-receipt window (a later send
  // would push it past batches.slice(0, 10)), so workspaceAssets does not name it.
  const owner = f.service.owner(f.id);
  f.store.values.get('workspace/' + owner).batches = [];
  // Day 98: the image (age 98d) is past the 97-day orphan cutoff, the report
  // (age since send 78d) is still live.
  f.advance(78 * DAY);
  assert.equal(f.service.expired(b), false, 'the report is live: this is not the legitimate expiry path');
  // The store still lists the batch/ record, but read returns null for it alone
  // (a raced deletion, a corrupt object, a transient miss).
  const realRead = f.store.read.bind(f.store);
  f.store.read = async k => k === 'batch/' + b.id ? null : realRead(k);
  const swept = await f.service.sweep();
  assert.deepEqual(swept, [], `an unreadable batch record refuses the orphan pass; swept ${JSON.stringify(swept)}`);
  assert.notEqual(await f.store.getImage(assetKey), null, 'the live report screenshot survives the null batch read');
});
// The same refusal must hold when the batch read THROWS rather than returning
// null (a transient store error, a malformed body). The commit and the
// validation record both claim "null or throwing", and without this the
// throwing branch could regress to `catch { continue }` with a green suite and
// delete a live report's screenshot.
test('a throwing batch read refuses the orphan pass instead of deleting a live report asset', async () => {
  const DAY = 86_400_000;
  const f = setup(); await f.login();
  const assetKey = 'aaaa1111-2222-3333-4444-555566667777';
  await f.store.image(assetKey, PNG); // captured at day 0
  const w = await f.service.save(f.id, 0, { comment: 'Held then sent', anchor, asset: assetKey });
  f.advance(20 * DAY);
  await f.login();
  const b = await f.service.send(f.id, w.revision); // sentAt day 20, expiresAt day 110
  const owner = f.service.owner(f.id);
  f.store.values.get('workspace/' + owner).batches = []; // aged out of the ten-receipt window
  f.advance(78 * DAY); // image age 98d, past the 97-day cutoff; the report is still live
  assert.equal(f.service.expired(b), false, 'the report is live: this is not the legitimate expiry path');
  const realRead = f.store.read.bind(f.store);
  f.store.read = async k => { if (k === 'batch/' + b.id) throw new Error('store unavailable'); return realRead(k); };
  const swept = await f.service.sweep();
  assert.deepEqual(swept, [], `a throwing batch read refuses the orphan pass; swept ${JSON.stringify(swept)}`);
  assert.notEqual(await f.store.getImage(assetKey), null, 'the live report screenshot survives the throwing batch read');
});
// Completeness needs BOTH halves: `!hasMore` AND a page below the cap. The page
// cap half is the one that catches a store whose hasMore is wrong or absent, so
// it needs a case hasMore alone cannot carry: a page filled to the cap that
// nonetheless reports hasMore false. Without the length half the orphan pass
// would run on that truncated page and delete an aged asset.
test('a page filled to the cap refuses the orphan pass even when hasMore says false', async () => {
  const f = setup(); await f.login();
  const orphanKey = 'bbbb1111-2222-3333-4444-555566667777';
  f.store.images.set(orphanKey, PNG);
  f.store.uploaded.set('images/' + orphanKey + '.jpg', f.service.now());
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1); // the orphan is past the cutoff
  // Fill the page to the cap, and have the store claim the listing is complete.
  for (let i = 0; i < PURGE_SCAN_MAX; i++) f.store.uploaded.set('workspace/pad-' + i + '.json', f.service.now());
  const listed = f.store.list.bind(f.store);
  f.store.list = async limit => { const { blobs } = await listed(limit); return { blobs, hasMore: false }; };
  const page = await f.store.list(PURGE_SCAN_MAX);
  assert.equal(page.blobs.length, PURGE_SCAN_MAX, 'the page is filled to the cap');
  assert.equal(page.hasMore, false, 'and the store claims there is no more');
  const swept = await f.service.sweep();
  assert.equal(swept.includes('images/' + orphanKey + '.jpg'), false, `a full page refuses regardless of hasMore; swept ${JSON.stringify(swept)}`);
  assert.equal(f.store.images.has(orphanKey), true, 'the aged asset survives a page filled to the cap');
});
// Production Gate Finding 3 (low): revoke writes revokedAt only to
// batch/<id>.json, so the workspace's receipt copy in `batches` never learned it
// and a revoked report showed a plain Revoke Link button again after a reload
// (the row's revoked marker was session-only React state). workspace() now merges
// each listed receipt's current revokedAt from its own batch record, bounded at
// the ten receipts send keeps, so the revoked state survives a fresh load.
test('a revoked report shows its revoked state on a fresh workspace load, not from session state', async () => {
  const f = setup(); await f.login();
  const w = await f.service.save(f.id, 0, { comment: 'Revoke then reload', anchor });
  const b = await f.service.send(f.id, w.revision);
  assert.equal((await f.service.workspace(f.id)).batches[0].revokedAt, undefined, 'the receipt is live before revocation');
  await f.service.revoke(f.id, b.id);
  const revokedAt = f.service.now();
  // A fresh workspace load, as a browser reload makes, reads the receipt's
  // current revokedAt from its batch record rather than any in-session marker.
  const reloaded = await f.service.workspace(f.id);
  assert.equal(reloaded.batches[0].id, b.id);
  assert.equal(reloaded.batches[0].revokedAt, revokedAt, 'the reloaded receipt carries the revocation time');
});
// Production Gate Finding 1 (blocking): list()'s limit is a MAXIMUM, so a short
// page can still be incomplete. Inferring completeness from a short page alone
// (ignoring hasMore) runs the orphan pass on a partial keep-set and deletes live
// assets. Here the store returns a short page (well under the cap) that OMITS the
// draft's workspace/ row and says hasMore true; the draft's own screenshot and
// attached file, named only in that omitted workspace, must survive.
test('a short-but-incomplete page (hasMore) refuses the orphan pass and keeps a draft asset', async () => {
  const f = setup(); await f.login();
  const a = await f.service.attach(f.id, { name: 'incomplete.pdf', bytes: PDF });
  const assetKey = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  await f.store.image(assetKey, PNG);
  await f.service.save(f.id, 0, { comment: 'A draft on a later page', anchor, asset: assetKey, attachments: [{ id: a.id }] });
  // Age both objects one ms past the orphan cutoff (window plus grace).
  f.advance(RETENTION_WINDOW + PURGE_GRACE + 1);
  // A short page (far under PURGE_SCAN_MAX) that is nonetheless incomplete: it
  // omits the workspace/ row naming the draft's assets, and says so with hasMore.
  const listed = f.store.list.bind(f.store);
  f.store.list = async limit => { const { blobs } = await listed(limit); return { blobs: blobs.filter(o => !/(?:^|\/)workspace\//.test(o.pathname)), hasMore: true }; };
  const swept = await f.service.sweep();
  assert.deepEqual(swept, [], `a short-but-incomplete page refuses the orphan pass; swept ${JSON.stringify(swept)}`);
  assert.notEqual(await f.store.getImage(assetKey), null, 'the draft screenshot survives an incomplete page');
  assert.notEqual(await f.store.getFile(a.id), null, 'the draft attachment survives an incomplete page');
});

// A compare-and-swap store with latency, mirroring BlobReviewStore.change: load,
// update, put with an etag check, 8 attempts, 40*(n+1) ms backoff.
class CasStore{
  constructor(load=40,put=90){this.data=new Map();this.etag=new Map();this.lat={load,put}}
  async load(k){await sleep(this.lat.load*(0.7+Math.random()*0.6));if(!this.data.has(k))return null;return {value:structuredClone(this.data.get(k)),etag:this.etag.get(k)}}
  async read(k){return (await this.load(k))?.value??null}
  async change(k,initial,update){for(let attempt=0;attempt<8;attempt++){const old=await this.load(k);const value=old?.value??initial();const answer=update(value);await sleep(this.lat.put*(0.7+Math.random()*0.6));const cur=this.etag.get(k);if((old&&cur===old.etag)||(!old&&cur===undefined)){this.data.set(k,structuredClone(value));this.etag.set(k,(cur??0)+1);return answer}await sleep(40*(attempt+1))}throw new Error('Review storage is busy; retry')}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// A burst for one address, the way an attacker probes: every answer's status and
// time must match between a listed and an unlisted address.
test('a burst for a listed address answers exactly like a burst for an unlisted one',{timeout:30000},async()=>{const config={siteName:'X',repository:'r',secret:'s'.repeat(64),reviewers:['sos@example.test'],owner:'jon@example.test',from:'f@example.test',intake:'a@example.test',siteUrl:'https://x.test'};const run=async(email,verifyBurst)=>{const deferred=[],sent=[];const s=new ReviewService(new CasStore(),async m=>{await sleep(150);sent.push(m.to[0]);return 'id'},config,Date.now,undefined,w=>{deferred.push(w)});const answer=async p=>{const start=Date.now();try{await p;return {st:200,ms:Date.now()-start}}catch(e){return {st:e.status??503,ms:Date.now()-start}}};let rs;if(verifyBurst){const b=newIdentity();await s.requestPin(b,'ip',email);rs=await Promise.all(Array.from({length:20},()=>answer(s.verify(b,'000000'))))}else rs=await Promise.all(Array.from({length:20},(_,i)=>answer(s.requestPin(newIdentity(),'ip-'+i,email))));await Promise.all(deferred);return {statuses:[...new Set(rs.map(r=>r.st))].sort(),slowest:Math.max(...rs.map(r=>r.ms)),sent:sent.length}};const [listed,unlisted,listedVerify,unlistedVerify]=await Promise.all([run('sos@example.test',false),run('stranger@example.test',false),run('sos@example.test',true),run('stranger@example.test',true)]);assert.deepEqual(listed.statuses,[200],'listed requests');assert.deepEqual(unlisted.statuses,[200],'unlisted requests');assert.deepEqual(listedVerify.statuses,[401],'wrong PINs after a listed request');assert.deepEqual(unlistedVerify.statuses,[401],'wrong PINs after an unlisted request');for(const [label,r] of Object.entries({listed,unlisted,listedVerify,unlistedVerify}))assert.ok(r.slowest<=PIN_REQUEST_FLOOR+150,label+' answered in '+r.slowest+' ms');assert.ok(listed.sent>=1&&listed.sent<=5,'the limits still hold: '+listed.sent+' sent');assert.equal(unlisted.sent,0)});
