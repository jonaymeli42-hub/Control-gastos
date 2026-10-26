import test from 'node:test';
import assert from 'node:assert/strict';
import {incomeOverview} from '../income-overview.js';
import {emptyLedger,monthlySummary,totals,validateLedger,makeBackup,validateBackup} from '../ledger-model.js';
const leg=(location,date,cents)=>({location,date,cents});
const op=(id,kind,legs,other={})=>({id,kind,description:id,legs,...other});
function fixture(){const d=emptyLedger();d.operations=[
 op('salary','income',[leg('cash','2026-10-01',100000)],{incomeSource:'own',incomeCategory:'salary'}),
 op('mel','income',[leg('virtual','2026-10-02',50000)],{incomeSource:'own',incomeCategory:'mel'}),
 op('pass','month',[leg('virtual','2026-09-30',-20000),leg('virtual','2026-10-01',20000)]),
 op('temporary','income',[leg('virtual','2026-10-03',30000)],{incomeSource:'temporary'}),
 op('card-contribution','income',[leg('cash','2026-10-04',40000)],{incomeSource:'contribution',incomeCategory:'card-loan'}),
 op('expense','expense',[leg('cash','2026-10-05',-10000)],{categoryId:'food'}),
 op('transfer','transfer',[leg('cash','2026-10-05',-5000),leg('virtual','2026-10-05',5000)])];return validateLedger(d);}
test('income and entries includes original income, incoming month passes and temporary loans once',()=>{
 const d=fixture(),before=structuredClone(d),t=incomeOverview(d,'2026-10');
 assert.deepEqual(t,{ownIncome:150000,carriedIncome:20000,temporaryIncome:30000,totalIncome:200000,origins:[{month:'2026-09',cents:20000}]});
 assert.equal(t.ownIncome,monthlySummary(d,'2026-10').income);assert.deepEqual(d,before);
 assert.equal(t.totalIncome-totals(d,'2026-10').netExpense,totals(d,'2026-10').balance);
});
test('outgoing month legs and transfers are not counted as incoming salary',()=>{
 const d=fixture();assert.equal(incomeOverview(d,'2026-09').totalIncome,0);
 d.operations.push(op('next-month','month',[leg('cash','2026-10-31',-10000),leg('cash','2026-11-01',10000)]));
 assert.equal(incomeOverview(d,'2026-10').carriedIncome,20000);assert.equal(incomeOverview(d,'2026-11').carriedIncome,10000);
});
test('multiple source months and accounts retain their origin with exact centavos',()=>{
 const d=fixture();d.operations.push(op('cash-pass','month',[leg('cash','2026-09-30',-123),leg('cash','2026-10-01',123)]),op('old-month','month',[leg('virtual','2026-08-31',-456),leg('virtual','2026-10-01',456)]));
 const t=incomeOverview(d,'2026-10');assert.deepEqual(t.origins,[{month:'2026-08',cents:456},{month:'2026-09',cents:20123}]);assert.equal(t.carriedIncome,20579);assert.equal(t.totalIncome,200579);
});
test('loan repayments and savings retain original balance effects, without changing gross entry totals',()=>{
 const d=fixture(),before=incomeOverview(d,'2026-10'),raw=totals(d,'2026-10');
 d.operations.push(op('repay','loan-repayment',[leg('virtual','2026-10-08',-30000)]),op('save','saving-out',[leg('cash','2026-10-09',-5000)]));
 assert.deepEqual(incomeOverview(validateLedger(d),'2026-10'),before);assert.equal(totals(d,'2026-10').balance,raw.balance-35000);assert.equal(totals(d,'2026-10').expense,raw.expense);
});
test('editing or deleting a pass or temporary loan recalculates the display without migrations',()=>{
 const d=fixture();d.operations.find(o=>o.id==='temporary').legs[0].date='2026-11-01';assert.equal(incomeOverview(d,'2026-10').temporaryIncome,0);assert.equal(incomeOverview(d,'2026-11').temporaryIncome,30000);
 d.operations=d.operations.filter(o=>o.id!=='pass');assert.equal(incomeOverview(d,'2026-10').carriedIncome,0);
});
test('empty months and backups retain their original format and personal income classification',async()=>{
 const d=fixture(),state={ledger:d,revision:3};assert.equal(incomeOverview(d,'2027-01').totalIncome,0);
 const restored=await validateBackup(await makeBackup(state));assert.deepEqual(restored,d);assert.deepEqual(incomeOverview(restored,'2026-10'),incomeOverview(d,'2026-10'));assert.equal(monthlySummary(restored,'2026-10').income,150000);
});
