import { before, after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
let env;
const owner = 'fictitious-owner';
const other = 'fictitious-other';
const path = `users/${owner}/diagnostics/access-check`;
const payload = () => ({ kind: 'fictitious-access-check', updatedAt: serverTimestamp() });
before(async () => { env = await initializeTestEnvironment({projectId:'demo-control-gastos',firestore:{rules:await readFile('firestore.rules','utf8')}}); });
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(),'_config/access'),{ownerUid:owner}); });
});
test('owner can create, read, update and delete a fictitious diagnostic', async () => {
 const db=env.authenticatedContext(owner).firestore(); const ref=doc(db,path);
 await assertSucceeds(setDoc(ref,payload())); await assertSucceeds(getDoc(ref));
 await assertSucceeds(setDoc(ref,payload())); await assertSucceeds(deleteDoc(ref));
});
test('anonymous and other account cannot access owner diagnostic', async () => {
 for(const db of [env.unauthenticatedContext().firestore(),env.authenticatedContext(other).firestore()]) {
  await assertFails(getDoc(doc(db,path))); await assertFails(setDoc(doc(db,path),payload())); await assertFails(deleteDoc(doc(db,path)));
 }
});
test('another account cannot use its own path to bypass owner restriction', async () => {
 const db=env.authenticatedContext(other).firestore();
 await assertFails(setDoc(doc(db,`users/${other}/diagnostics/access-check`),payload()));
});
test('configuration cannot be read or changed by owner or another user', async () => {
 for(const uid of [owner,other]) { const ref=doc(env.authenticatedContext(uid).firestore(),'_config/access');
 await assertFails(getDoc(ref)); await assertFails(setDoc(ref,{ownerUid:uid})); await assertFails(deleteDoc(ref)); }
});
test('invalid shape, old timestamp and financial writes are denied', async () => {
 const db=env.authenticatedContext(owner).firestore();
 await assertFails(setDoc(doc(db,path),{...payload(),amount:5000}));
 await assertFails(setDoc(doc(db,path),{kind:'real-data',updatedAt:serverTimestamp()}));
 await assertFails(setDoc(doc(db,path),{kind:'fictitious-access-check',updatedAt:new Date(0)}));
 await assertFails(setDoc(doc(db,`users/${owner}/operations/fake`),{amount:5000}));
 await assertFails(getDocs(collection(db,`users/${owner}/diagnostics`)));
});
test('missing or empty configuration fails closed', async () => {
 for(const value of [null,'']) {
  await env.withSecurityRulesDisabled(async c=>{const ref=doc(c.firestore(),'_config/access');if(value===null)await deleteDoc(ref);else await setDoc(ref,{ownerUid:value});});
  await assertFails(setDoc(doc(env.authenticatedContext(owner).firestore(),path),payload()));
 }
});
test('sandbox accepts only fixed fictitious values and monotonic revisions', async () => {
 const db=env.authenticatedContext(owner).firestore();const ref=doc(db,`users/${owner}/diagnostics/backup-check`);
 const value=(amountCents,revision)=>({kind:'fictitious-backup-check',amountCents,revision,updatedAt:serverTimestamp()});
 await assertFails(setDoc(ref,value(12345,2)));
 await assertSucceeds(setDoc(ref,value(12345,1)));
 await assertSucceeds(getDoc(ref));
 await assertFails(setDoc(ref,value(12345,1)));
 await assertFails(setDoc(ref,value(99999,2)));
 await assertFails(setDoc(ref,{...value(54321,2),description:'forbidden'}));
 await assertSucceeds(setDoc(ref,value(54321,2)));
 await assertFails(deleteDoc(ref));
 await assertFails(getDoc(doc(env.authenticatedContext(other).firestore(),`users/${owner}/diagnostics/backup-check`)));
 await assertFails(setDoc(doc(env.authenticatedContext(other).firestore(),`users/${other}/diagnostics/backup-check`),value(12345,1)));
});

// Financial storage is isolated from the existing fictitious diagnostics.
const financialPath = `users/${owner}/financial/ledger`;
const ledgerData = () => ({operations:[],categories:[{id:'uncategorized',name:'Sin categoría'}]});
const financial = (revision=1,lastMutationId='mutation-1') => ({schemaVersion:1,revision,lastMutationId,ledger:ledgerData(),updatedAt:serverTimestamp()});
test('only owner can read and write the financial ledger; anonymous and other accounts are rejected', async()=>{
 const db=env.authenticatedContext(owner).firestore(),ref=doc(db,financialPath);
 await assertSucceeds(getDoc(ref));await assertSucceeds(setDoc(ref,financial()));
 for(const otherDb of [env.unauthenticatedContext().firestore(),env.authenticatedContext(other).firestore()]){await assertFails(getDoc(doc(otherDb,financialPath)));await assertFails(setDoc(doc(otherDb,financialPath),financial(2,'mutation-2')));}
 await assertFails(setDoc(doc(env.authenticatedContext(other).firestore(),`users/${other}/financial/ledger`),financial()));
 await assertFails(getDocs(collection(db,`users/${owner}/financial`)));await assertFails(deleteDoc(ref));
});
test('financial schema, server timestamp and increasing revision are mandatory',async()=>{
 const ref=doc(env.authenticatedContext(owner).firestore(),financialPath);
 await assertFails(setDoc(ref,financial(2)));await assertFails(setDoc(ref,{...financial(),schemaVersion:2}));await assertFails(setDoc(ref,{...financial(),extra:'unknown'}));await assertFails(setDoc(ref,{...financial(),updatedAt:new Date(0)}));await assertFails(setDoc(ref,{...financial(),ledger:{operations:[],categories:[]}}));
 await assertSucceeds(setDoc(ref,financial()));await assertFails(setDoc(ref,financial()));await assertFails(setDoc(ref,financial(2)));await assertSucceeds(setDoc(ref,financial(2,'mutation-2')));await assertFails(setDoc(ref,financial(4,'mutation-3')));
});
test('repository transactions reject concurrent overwrite and a repeated mutation does not duplicate',async()=>{
 const {createLedgerRepository}=await import('../ledger-repository.js');const sdk=await import('firebase/firestore');
 const db=env.authenticatedContext(owner).firestore(),repo=createLedgerRepository(db,owner,sdk);
 const initial=await repo.read();if(initial.revision!==0)throw new Error('Unexpected initial revision');
 const data=ledgerData();data.operations.push({id:'stable-transfer',kind:'transfer',description:'Fictitious transfer',legs:[{location:'cash',date:'2026-10-06',cents:-400000},{location:'virtual',date:'2026-10-06',cents:400000}]});
 const saved=await repo.save(data,0,'first-mutation');if(saved.revision!==1)throw new Error('Missing confirmed save');
 const repeated=await repo.save(data,0,'first-mutation');if(repeated.revision!==1)throw new Error('Repeated mutation duplicated');
 const a=structuredClone(data),b=structuredClone(data);a.operations[0].description='Device A';b.operations[0].description='Device B';
 const results=await Promise.allSettled([repo.save(a,1,'device-a'),repo.save(b,1,'device-b')]);if(results.filter(r=>r.status==='fulfilled').length!==1||results.filter(r=>r.status==='rejected'&&r.reason.code==='ledger/conflict').length!==1)throw new Error('Concurrency protection failed');
 const current=await repo.read();if(current.revision!==2||current.ledger.operations[0].legs.length!==2)throw new Error('Incomplete linked transfer');
});
