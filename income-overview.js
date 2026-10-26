// Cash entering the selected month, kept distinct from earned personal income.
export function incomeDetailKey(operation){
 if(operation.kind==='month')return 'carried';
 if(operation.kind==='income'&&operation.incomeSource==='temporary')return 'temporary';
 return null;
}
export function incomeOverview(ledger,month){
 let ownIncome=0,carriedIncome=0,temporaryIncome=0;
 const origins=new Map();
 for(const op of ledger.operations){
  for(const leg of op.legs){
   if(leg.date.slice(0,7)!==month||leg.cents<=0)continue;
   if(op.kind==='income'&&op.incomeSource==='own')ownIncome+=leg.cents;
   else if(op.kind==='income'&&op.incomeSource==='temporary')temporaryIncome+=leg.cents;
   else if(op.kind==='month'){
    const source=op.legs.find(part=>part.cents<0)?.date.slice(0,7);
    if(!source||source===month)continue;
    carriedIncome+=leg.cents;origins.set(source,(origins.get(source)||0)+leg.cents);
   }
  }
 }
 return {ownIncome,carriedIncome,temporaryIncome,totalIncome:ownIncome+carriedIncome+temporaryIncome,origins:[...origins].sort(([a],[b])=>a.localeCompare(b)).map(([month,cents])=>({month,cents}))};
}
