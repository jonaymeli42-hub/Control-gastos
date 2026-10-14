import test from 'node:test';
import assert from 'node:assert/strict';
import {orderedMovementItems} from '../movement-order.js';
const op=(id,date)=>({id,legs:[{date,location:'cash',cents:100}]});
test('new backdated entries stay last within their date and editing keeps their position',()=>{
 const operations=[op('first','2026-10-13'),op('second','2026-10-13'),op('today','2026-10-14'),op('late','2026-10-13')];
 const before=structuredClone(operations);
 assert.deepEqual(orderedMovementItems(operations,'2026-10').map(x=>x.op.id),['today','first','second','late']);
 assert.deepEqual(operations,before);
 operations[0]={...operations[0],description:'Edited'};
 assert.deepEqual(orderedMovementItems(operations,'2026-10').map(x=>x.op.id),['today','first','second','late']);
});
test('linked passes appear once in each applicable month at the end of their date',()=>{
 const operations=[op('existing','2026-11-01'),{id:'pass',legs:[{date:'2026-10-31',cents:-100},{date:'2026-11-01',cents:100}]}];
 assert.deepEqual(orderedMovementItems(operations,'2026-11').map(x=>x.op.id),['existing','pass']);
 assert.equal(orderedMovementItems(operations,'2026-10')[0].date,'2026-10-31');
});
