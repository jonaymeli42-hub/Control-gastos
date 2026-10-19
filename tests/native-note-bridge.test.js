import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNativeNote,consumeNativeNote,nativeReturnUrl} from '../native-note-bridge.js';
import {createPendingExpenseStore,validPendingExpenses} from '../pending-expenses.js';
const note={id:'android_123e4567-e89b-12d3-a456-426614174000',text:'6700 en el kiosco',createdAt:'2026-10-18T18:30:00.000Z',date:'2026-10-18',nativeReceipt:'token-123e4567-e89b-12d3-a456-426614174000'};
const fragment=n=>'#anotar='+encodeURIComponent(JSON.stringify(n));
function memory(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};}
test('native note travels in a fragment, retains identity and timestamp, and is not a financial operation',()=>{
 assert.deepEqual(parseNativeNote(fragment(note)),note);assert.equal(validPendingExpenses({version:1,notes:[note]}),true);
 const store=createPendingExpenseStore(memory(),'notes'),location=new URL('https://example.test/Control-gastos/instalar.html?nota='+note.id+fragment(note));let cleaned;
 consumeNativeNote(store,location,{replaceState:(_a,_b,url)=>{cleaned=url;}});assert.equal(cleaned.hash,'');assert.equal(cleaned.searchParams.get('nota'),note.id);assert.deepEqual(store.read().notes,[note]);
 consumeNativeNote(store,location,{replaceState(){}});assert.equal(store.read().notes.length,1);
 assert.throws(()=>consumeNativeNote(store,new URL('https://example.test/'+fragment({...note,nativeReceipt:'a-different-token-123456'})),{replaceState(){}}));
});
test('malformed imports and untrusted return identifiers are rejected without erasing valid notes',()=>{
 for(const changes of [{nativeReceipt:'short'},{id:'web-note'},{date:'2026-02-30'},{text:''},{extra:'unexpected'}])assert.throws(()=>parseNativeNote(fragment({...note,...changes})));
 assert.throws(()=>parseNativeNote('#anotar=%invalid'));assert.equal(parseNativeNote('#other=ignored'),null);
 assert.equal(nativeReturnUrl({...note,nativeReceipt:'bad'},'gastos'),null);assert.equal(nativeReturnUrl(note,'other'),null);
 const url=nativeReturnUrl(note,'gastos');assert.match(url,/^intent:\/\/registrado\/android_/);assert.match(url,/package=com.controlfinanzas.anotargasto/);assert.match(url,/app=gastos/);
});

test('silent protocol is additive, upgrades the same pending note and uses a no-display receipt',async()=>{
 const {createNativeCompletionQueue}=await import('../native-note-bridge.js');
 const silent={...note,nativeCompletion:'silent-v1'};assert.deepEqual(parseNativeNote(fragment(silent)),silent);
 const store=createPendingExpenseStore(memory(),'pending');store.upsert(note);store.upsert(silent);assert.equal(store.read().notes.length,1);assert.equal(store.read().notes[0].nativeCompletion,'silent-v1');
 const url=nativeReturnUrl(silent,'tarjetas');assert.match(url,/^intent:\/\/registrado-silencioso\//);assert.match(url,/launchFlags=0x10010000/);assert.match(url,/browser_fallback_url=/);
 assert.match(nativeReturnUrl(note,'gastos'),/^intent:\/\/registrado\//);
 for(const bad of [{...silent,nativeCompletion:'other'},{...silent,nativeReceipt:undefined}])assert.throws(()=>parseNativeNote(fragment(bad)));
 const storage=memory(),queue=createNativeCompletionQueue(storage);queue.enqueue(silent,'gastos');queue.enqueue(silent,'gastos');assert.equal(queue.read().length,1);
 let navigated='';assert.equal(queue.flush({active:false,navigate:url=>{navigated=url;}}),false);assert.equal(navigated,'');assert.equal(queue.read().length,1);
 const recreated=createNativeCompletionQueue(storage);assert.equal(recreated.flush({active:true,navigate:url=>{navigated=url;}}),true);assert.match(navigated,/registrado-silencioso/);assert.equal(recreated.read().length,0);
});
test('failed receipt dispatch keeps the queue and never stores the note text',async()=>{
 const {createNativeCompletionQueue,NATIVE_COMPLETION_KEY}=await import('../native-note-bridge.js'),storage=memory(),queue=createNativeCompletionQueue(storage);queue.enqueue({...note,nativeCompletion:'silent-v1'},'tarjetas');
 assert(!storage.getItem(NATIVE_COMPLETION_KEY).includes(note.text));assert.throws(()=>queue.flush({active:true,navigate(){throw Error('Browser unavailable');}}));assert.equal(queue.read().length,1);
 storage.setItem(NATIVE_COMPLETION_KEY,'{"bad":true}');assert.throws(()=>queue.read());assert.equal(storage.getItem(NATIVE_COMPLETION_KEY),'{"bad":true}');
});
