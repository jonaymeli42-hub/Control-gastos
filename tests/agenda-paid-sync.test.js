import test from 'node:test';
import assert from 'node:assert/strict';
import M from '../agenda-model.js';
import {emptyLedger,makeBackup,validateBackup} from '../ledger-model.js';
function fixture(){
 const m={order:[],debts:[M.block('Luz',[['Importe','1000'],['Notas','No cambiar']]),M.block('Luz',[['Importe','2000']]),M.block('Movistar',[['Hogar','3000'],['Celular','4000']]),M.block('Préstamos míos',[['Galicia','5000'],['Otro banco','6000']])],cards:[M.block('Visa',[['Total','10000'],['Mío','7000'],['Mes anterior','5000']])],receivables:[M.receivable('Persona')]};
 m.debts[0].fields[0].previousAmount='800';M.syncOrder(m);return m;
}
const orderFor=(m,group,item,field)=>m.order.find(row=>row.sourceKey===`${group}:${item.id}${field?':'+field.id:''}`);
test('source and order set paid and pending in both directions without changing ids or amounts',()=>{
 const m=fixture(),light=m.debts[0],f=light.fields[0],row=orderFor(m,'debts',light),ids=m.order.map(r=>r.id),count=m.order.length,total=M.ownTotal(m);
 assert(M.setPaid(m,'debts',light.id,f.id,true));assert.equal(row.id,orderFor(m,'debts',light).id);assert.equal(orderFor(m,'debts',light).paid,true);
 assert(M.setPaid(m,'order',row.id,null,false));assert.equal(f.paid,false);assert.equal(orderFor(m,'debts',light).paid,false);
 assert(M.setPaid(m,'order',row.id,null,true));assert.equal(f.paid,true);
 assert(M.setPaid(m,'debts',light.id,f.id,false));assert.equal(orderFor(m,'debts',light).paid,false);
 M.syncOrder(m);M.syncOrder(m);assert.deepEqual(m.order.map(r=>r.id),ids);assert.equal(m.order.length,count);assert.deepEqual(M.ownTotal(m),total);assert.equal(f.previousAmount,'800');assert.equal(light.fields[1].value,'No cambiar');assert.equal(m.debts[1].fields[0].paid,undefined);assert(M.validMonth(m));
});
test('Movistar and loans synchronize each linked field independently',()=>{
 const m=fixture();
 for(const item of [m.debts[2],m.debts[3]]){
  const [a,b]=item.fields,first=orderFor(m,'debts',item,a),second=orderFor(m,'debts',item,b);
  M.setPaid(m,'order',first.id,null,true);assert.equal(a.paid,true);assert.equal(b.paid,undefined);assert.equal(orderFor(m,'debts',item,b).paid,false);
  M.setPaid(m,'debts',item.id,b.id,true);assert.equal(orderFor(m,'debts',item,b).paid,true);
  M.setPaid(m,'order',second.id,null,false);assert.equal(b.paid,false);assert.equal(orderFor(m,'debts',item,a).paid,true);
 }
});
test('an aggregate service is paid only after every eligible bill; order updates only its bills',()=>{
 const m=fixture(),item=m.debts[0];item.fields.push({...M.field('Importe','300'),kind:'money'},{...M.field('Información','99'),kind:'text'},{...M.field('Importe ajeno','400'),kind:'money',owner:'Ajeno'});M.syncOrder(m);
 const row=orderFor(m,'debts',item);
 M.setPaid(m,'debts',item.id,item.fields[0].id,true);assert.equal(orderFor(m,'debts',item).paid,false);
 M.setPaid(m,'debts',item.id,item.fields[2].id,true);assert.equal(orderFor(m,'debts',item).paid,true);
 M.setPaid(m,'order',row.id,null,false);assert.equal(item.fields[0].paid,false);assert.equal(item.fields[2].paid,false);
 M.setPaid(m,'order',row.id,null,true);assert.equal(item.fields[0].paid,true);assert.equal(item.fields[2].paid,true);
 for(const index of [1,3,4])assert.equal(item.fields[index].paid,undefined);
});
test('card status is shared with its order row, without changing numeric fields or receivables',()=>{
 const m=fixture(),card=m.cards[0],row=orderFor(m,'cards',card),before=JSON.stringify(card.fields);
 M.setPaid(m,'cards',card.id,null,true);assert.equal(orderFor(m,'cards',card).paid,true);
 M.setPaid(m,'order',row.id,null,false);assert.equal(card.paid,false);
 M.setPaid(m,'order',row.id,null,true);assert.equal(card.paid,true);
 assert.equal(JSON.stringify(card.fields),before);assert.equal(m.receivables[0].fields[0].paid,false);
});
test('sync uses source status for existing rows, including explicit pending over legacy Pagado',()=>{
 const m=fixture(),item=m.debts[0],f=item.fields[0];f.amountSide='label';f.label='1000';f.value='Pagado';M.syncOrder(m);assert.equal(orderFor(m,'debts',item).paid,true);
 M.setPaid(m,'order',orderFor(m,'debts',item).id,null,false);M.syncOrder(m);assert.equal(f.value,'Pagado');assert.equal(f.paid,false);assert.equal(orderFor(m,'debts',item).paid,false);
 f.paid=true;orderFor(m,'debts',item).paid=false;M.syncOrder(m);assert.equal(orderFor(m,'debts',item).paid,true);
});
test('renaming and sorting keep links; unknown or orphaned links never create an expense',()=>{
 const m=fixture(),item=m.debts[0],row=orderFor(m,'debts',item),id=row.id;item.label='Otra boleta';M.syncOrder(m);M.sortOrder(m,'2026-10');M.setPaid(m,'order',id,null,true);assert.equal(item.fields[0].paid,true);
 const before=JSON.stringify(m);assert.equal(M.setPaid(m,'order','missing',null,true),false);assert.equal(M.setPaid(m,'debts',item.id,'missing',true),false);assert.equal(JSON.stringify(m),before);
 m.debts=m.debts.filter(i=>i.id!==item.id);assert.equal(M.setPaid(m,'order',id,null,true),false);M.syncOrder(m);assert(!m.order.some(i=>i.id===id));
});
test('only the selected month changes; preparing a month resets both views without touching the old one',()=>{
 const m=fixture(),previous=structuredClone(m);M.setPaid(m,'order',orderFor(m,'debts',m.debts[0]).id,null,true);const original=structuredClone(m),next=M.nextMonth(m);
 assert.deepEqual(m,original);assert(next.order.every(r=>r.paid===false));assert.equal(next.debts[0].fields[0].paid,false);assert.equal(previous.debts[0].fields[0].paid,undefined);
});
test('backup and restore retain synchronized marks and original financial records',async()=>{
 const ledger=emptyLedger(),m=fixture();M.setPaid(m,'order',orderFor(m,'cards',m.cards[0]).id,null,true);
 const paymentAgenda={version:1,months:{'2026-10':m}},backup=await makeBackup({ledger,revision:2,paymentAgenda});assert.deepEqual(await validateBackup(backup),ledger);
 const restored=JSON.parse(JSON.stringify(backup.data.paymentAgenda));M.syncOrder(restored.months['2026-10']);assert.deepEqual(restored,paymentAgenda);
});
