import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticData,checksum,validateDiagnosticBackup} from '../backup-test-format.js';
async function sample(){const data=diagnosticData(12345);return {format:'control-gastos-backup',schemaVersion:1,mode:'diagnostic-only',complete:true,source:'firestore',timeZone:'America/Argentina/Buenos_Aires',revision:1,snapshotId:'fake-1',createdAt:'2026-10-06T00:00:00Z',data,checksum:await checksum(data)};}
test('fictitious backup can be validated and recovered',async()=>assert.equal(await validateDiagnosticBackup(await sample()),12345));
test('corruption, incomplete copy, wrong mode and malformed revision are rejected',async()=>{
 const original=await sample();
 for(const changed of [{...original,checksum:'wrong'},{...original,complete:false},{...original,mode:'real'},{...original,revision:-1},{...original,data:{...original.data,operations:[]}},{...original,data:{...original.data,operations:[{id:'diagnostic-only',amountCents:54321}]}}])await assert.rejects(validateDiagnosticBackup(changed));
});
test('arbitrary and real financial amounts are not accepted in sandbox',()=>{assert.throws(()=>diagnosticData(10000000));});
