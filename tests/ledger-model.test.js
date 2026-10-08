import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyLedger,validateLedger,totals,makeBackup,validateBackup,checksum,formatMoney} from '../ledger-model.js';
const leg=(location,date,cents)=>({location,date,cents});
const op=(id,kind,legs,extra={})=>({id,kind,description:id,legs,...extra});
const sample=()=>({...emptyLedger(),operations:[
 op('own','income',[leg('virtual','2026-10-05',100_000_000)],{incomeSource:'own'}),
 op('contribution','income',[leg('virtual','2026-10-05',30_000_000)],{incomeSource:'contribution'}),
 op('card-payment','expense',[leg('virtual','2026-10-06',-100_000_000)],{categoryId:'card'}),
 op('transfer','transfer',[leg('virtual','2026-10-06',-200_000),leg('cash','2026-10-06',200_000)]),
 op('pass','month',[leg('cash','2026-09-30',-400_000),leg('cash','2026-10-06',400_000)]),
 op('save','saving-out',[leg('cash','2026-10-06',-150_000)]),
 op('return','saving-in',[leg('cash','2026-10-06',50_000)])]});
test('complete payment and contributions remain separate; transfers/passes are not income',()=>{
 const data=validateLedger(sample());assert.deepEqual(totals(data,'2026-10'),{balance:30_300_000,income:100_000_000,contributions:30_000_000,expense:100_000_000,sent:150_000,returned:50_000,savings:100_000,netExpense:70_000_000});
 assert.equal(totals(data,'2026-09','cash').balance,-400_000);assert.equal(totals(data,'2026-11').balance,0);assert.equal(totals(data,'2026-10','cash').balance,500_000);
});
test('date editing affects only the dated months and deleting the transfer removes both legs',()=>{
 const data=sample();data.operations[2].legs[0].date='2026-09-12';assert.equal(totals(data,'2026-10').expense,0);assert.equal(totals(data,'2026-09').expense,100_000_000);
 const before=totals(data,'2026-10');data.operations=data.operations.filter(op=>op.id!=='transfer');assert.equal(totals(data,'2026-10').balance,before.balance);assert.equal(totals(data,'2026-10','cash').balance,300_000);
});
test('removing a category retains its expenses and balances',()=>{
 const data=sample(),before=totals(data,'2026-10');data.categories=data.categories.filter(c=>c.id!=='card');data.operations.find(op=>op.id==='card-payment').categoryId='uncategorized';validateLedger(data);assert.deepEqual(totals(data,'2026-10'),before);
});
test('reject malformed transfers, dates, amounts, duplicate IDs, missing categories and unknown fields',()=>{
 for(const corrupt of [d=>d.operations[3].legs.pop(),d=>d.operations[3].legs[1].cents++,d=>d.operations[3].legs[1].location='virtual',d=>d.operations[4].legs[1].date='2026-09-30',d=>d.operations[2].legs[0].date='2026-02-30',d=>d.operations[2].legs[0].cents=-1.5,d=>d.operations[2].categoryId='absent',d=>d.operations.push(structuredClone(d.operations[0])),d=>d.operations[0].extra='unknown',d=>d.categories[0].name='Sin categoría']){const data=sample();corrupt(data);assert.throws(()=>validateLedger(data));}
});
test('backup contains categories and all linked legs; verifies integrity and rejects diagnostic backups',async()=>{
 const data=sample();const backup=await makeBackup({revision:5,ledger:data});assert.deepEqual(await validateBackup(backup),data);
 const changed=structuredClone(backup);changed.data.operations[0].legs[0].cents++;await assert.rejects(validateBackup(changed),/integridad/);
 const wrongLink=structuredClone(backup);wrongLink.data.operations[3].legs[1].cents++;wrongLink.checksum=await checksum(wrongLink.data);await assert.rejects(validateBackup(wrongLink),/vinculadas/);
 await assert.rejects(validateBackup({...backup,mode:'diagnostic-only'}));
 const initial=await makeBackup({revision:0,ledger:emptyLedger()});assert.deepEqual(await validateBackup(initial),emptyLedger());
});

test('centavos remain exact in arithmetic and display including large totals',()=>{const data=emptyLedger();data.operations=[op('cent-in','income',[leg('cash','2026-10-06',12345)],{incomeSource:'own'}),op('cent-out','expense',[leg('cash','2026-10-06',-1)],{categoryId:'food'})];assert.equal(totals(data,'2026-10').balance,12344);assert.match(formatMoney(12344),/123,44/);assert.match(formatMoney(-1),/−|-.*0,01/);assert.match(formatMoney(8_000_000_000_000_001),/80\.000\.000\.000\.000,01/);});

test('monthly summary separates personal income origins, contributions, expenses and net savings',async()=>{
 const {monthlySummary}=await import('../ledger-model.js');
 const data=sample();
 data.operations.push(op('daily','income',[leg('cash','2026-10-07',12345)],{incomeSource:'own',incomeCategory:'salary'}),op('mel','income',[leg('virtual','2026-10-08',25000000)],{incomeSource:'own',incomeCategory:'mel'}),op('misa','income',[leg('cash','2026-10-08',10000000)],{incomeSource:'own',incomeCategory:'misa'}));
 const summary=monthlySummary(validateLedger(data),'2026-10');
 assert.equal(summary.salary,12345);assert.equal(summary.mel,25000000);assert.equal(summary.misa,10000000);assert.equal(summary.extra,100000000);
 assert.equal(summary.income,summary.salary+summary.mel+summary.misa+summary.extra);
 assert.equal(summary.contributions,30000000);assert.equal(summary.expense,100000000);assert.equal(summary.netExpense,70000000);assert.equal(summary.savings,100000);
 data.operations.find(x=>x.id==='daily').legs[0].date='2026-09-07';assert.equal(monthlySummary(data,'2026-10').salary,0);
 assert.deepEqual(await validateBackup(await makeBackup({revision:6,ledger:data})),data);
});
test('legacy personal income can be categorized for display without rewriting records',async()=>{
 const {monthlySummary}=await import('../ledger-model.js');const data=emptyLedger();
 for(const [description,cents] of [['Sueldo diario',10000],['Sueldo Melanie',20000],['Ingreso Misa',30000],['Extra de trabajo',40000]])data.operations.push(op('legacy-'+data.operations.length,'income',[leg('cash','2026-10-08',cents)],{incomeSource:'own',description}));
 const before=JSON.stringify(data),summary=monthlySummary(data,'2026-10');assert.equal(summary.salary,10000);assert.equal(summary.mel,20000);assert.equal(summary.misa,30000);assert.equal(summary.extra,40000);assert.equal(JSON.stringify(data),before);
});
test('only personal income accepts its explicit origin',()=>{
 const data=sample();data.operations[0].incomeCategory='mel';validateLedger(data);
 data.operations[0].incomeCategory='unknown';assert.throws(()=>validateLedger(data),/Detalle/);
 delete data.operations[0].incomeCategory;data.operations[1].incomeCategory='mel';assert.throws(()=>validateLedger(data),/Detalle/);
 delete data.operations[1].incomeCategory;data.operations[2].incomeCategory='extra';assert.throws(()=>validateLedger(data),/Detalle/);
});
