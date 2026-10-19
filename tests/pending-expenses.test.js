import test from 'node:test';
import assert from 'node:assert/strict';
import {createPendingExpenseStore,validPendingExpenses,pendingOperationId} from '../pending-expenses.js';
import {emptyLedger,makeBackup,validateBackup,checksum} from '../ledger-model.js';
const note={id:'note-1',text:'6700 en el kiosco',createdAt:'2026-10-18T12:00:00.000Z',date:'2026-10-18'};
function memory(){const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value)};}
test('quick notes persist separately from financial data and repeated recognition results update one note',()=>{
 const storage=memory(),store=createPendingExpenseStore(storage,'notes');const ledger=emptyLedger(),before=structuredClone(ledger);
 store.upsert({...note,text:'6700'});store.upsert(note);
 assert.equal(store.read().notes.length,1);assert.equal(store.read().notes[0].text,note.text);
 assert.deepEqual(createPendingExpenseStore(storage,'notes').read().notes,[note]);assert.deepEqual(ledger,before);
 assert.equal(pendingOperationId(note.id),'audio_note-1');
 store.remove(note.id);assert.equal(store.read().notes.length,0);
});
test('failed storage or malformed data is never silently replaced',()=>{
 const storage=memory();storage.setItem('notes','broken');const store=createPendingExpenseStore(storage,'notes');assert.throws(()=>store.upsert(note));assert.equal(storage.getItem('notes'),'broken');
 const failed=createPendingExpenseStore({getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}},'notes');assert.throws(()=>failed.upsert(note));
 assert.equal(validPendingExpenses({version:1,notes:[note,note]}),false);assert.equal(validPendingExpenses({version:1,notes:[{...note,date:'2026-02-31'}]}),false);
});
test('backup includes notes without turning them into expenses and validates old backups',async()=>{
 const ledger=emptyLedger(),pendingExpenses={version:1,notes:[note]};const backup=await makeBackup({ledger,revision:1,pendingExpenses});
 assert.deepEqual(backup.data.pendingExpenses,pendingExpenses);assert.deepEqual(await validateBackup(backup),ledger);
 assert.deepEqual(await validateBackup(await makeBackup({ledger,revision:1})),ledger);
 const restored=createPendingExpenseStore(memory(),'restored');restored.restore(backup.data.pendingExpenses);assert.deepEqual(restored.read(),pendingExpenses);
 backup.data.pendingExpenses.notes[0].text='Edited';await assert.rejects(()=>validateBackup(backup),/integridad/);
 backup.data.pendingExpenses.notes[0].text='';backup.checksum=await checksum(backup.data);await assert.rejects(()=>validateBackup(backup),/pendientes/);
});
test('a backup preserves silent native completion capability without adding a financial operation',async()=>{
 const ledger=emptyLedger(),native={...note,id:'android_backup_note',nativeReceipt:'backup-token-1234567890',nativeCompletion:'silent-v1'};
 const pendingExpenses={version:1,notes:[native]},backup=await makeBackup({ledger,revision:1,pendingExpenses});
 assert.deepEqual(await validateBackup(backup),ledger);const restored=createPendingExpenseStore(memory(),'restored-native');restored.restore(backup.data.pendingExpenses);assert.deepEqual(restored.read().notes,[native]);assert.equal(ledger.operations.length,0);
});
