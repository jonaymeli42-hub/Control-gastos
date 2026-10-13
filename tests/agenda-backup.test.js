import test from 'node:test';
import assert from 'node:assert/strict';
import AgendaModel from '../agenda-model.js';
import {emptyLedger,makeBackup,validateBackup,checksum} from '../ledger-model.js';
test('financial backup includes all agenda months without changing ledger and restores legacy backups',async()=>{const ledger=emptyLedger(),paymentAgenda={version:1,months:{'2026-10':AgendaModel.emptyMonth(),'2026-11':AgendaModel.emptyMonth()}};const backup=await makeBackup({ledger,revision:3,paymentAgenda});assert.deepEqual(backup.data.paymentAgenda,paymentAgenda);assert.deepEqual(await validateBackup(backup),ledger);assert.deepEqual(await validateBackup(await makeBackup({ledger,revision:3})),ledger);backup.data.paymentAgenda.months['2026-10'].order[0].paid=true;await assert.rejects(()=>validateBackup(backup),/integridad/);});
test('malformed agenda is rejected before restoring financial records',async()=>{const backup=await makeBackup({ledger:emptyLedger(),revision:0});backup.data.paymentAgenda={version:1,months:{'2026-10':{order:[]}}};backup.checksum=await checksum(backup.data);await assert.rejects(()=>validateBackup(backup),/agenda/);});
