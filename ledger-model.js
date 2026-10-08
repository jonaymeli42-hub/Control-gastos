// Money is stored as integer centavos. This module contains no personal data.
export const DEFAULT_CATEGORIES = [{id:'food',name:'Comida'},{id:'outings',name:'Salidas'},{id:'fuel',name:'Combustible'},{id:'transport',name:'Transporte'},{id:'card',name:'Tarjeta'},{id:'uncategorized',name:'Sin categoría'}];
export const emptyLedger = () => ({operations:[],categories:structuredClone(DEFAULT_CATEGORIES)});
const validId = id => typeof id==='string' && /^[A-Za-z0-9_-]{1,100}$/.test(id);
const plain = value => value!==null && typeof value==='object' && !Array.isArray(value);
const require = (ok,message) => {if(!ok)throw new Error(message);};
function keys(value,allowed){require(plain(value)&&Object.keys(value).every(key=>allowed.includes(key)),'El registro contiene campos desconocidos.');}
export function validDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const year=Number(date.slice(0,4));return year>=2000&&year<=2100&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;}
export function validateLedger(input){
 keys(input,['operations','categories']);
 require(Array.isArray(input.operations)&&input.operations.length<=4000&&Array.isArray(input.categories)&&input.categories.length>0&&input.categories.length<=100,'La cantidad de registros o categorías excede el límite.');
 const ids=new Set(),names=new Set();
 for(const c of input.categories){keys(c,['id','name']);require(validId(c.id)&&!ids.has(c.id)&&typeof c.name==='string'&&c.name===c.name.trim()&&c.name.length>0&&c.name.length<=40,'Categoría inválida o repetida.');const name=c.name.toLocaleLowerCase('es');require(!names.has(name),'Los nombres de las categorías deben ser diferentes.');ids.add(c.id);names.add(name);}
 require(input.categories.some(c=>c.id==='uncategorized'&&c.name==='Sin categoría'),'Falta la categoría Sin categoría.');
 const opIds=new Set();let absoluteTotal=0;
 for(const op of input.operations){
  keys(op,['id','kind','incomeSource','incomeCategory','categoryId','description','legs']);
  require(validId(op.id)&&!opIds.has(op.id),'Identificador de movimiento inválido o repetido.');opIds.add(op.id);
  require(['income','expense','transfer','month','saving-out','saving-in'].includes(op.kind)&&typeof op.description==='string'&&op.description.length>0&&op.description.length<=100,'Tipo o descripción inválidos.');
  const linked=['transfer','month'].includes(op.kind);
  require(Array.isArray(op.legs)&&op.legs.length===(linked?2:1),'Las partes del movimiento están incompletas.');
  for(const leg of op.legs){keys(leg,['location','date','cents','description']);require(['cash','virtual'].includes(leg.location)&&validDate(leg.date)&&Number.isSafeInteger(leg.cents)&&leg.cents!==0&&Math.abs(leg.cents)<=1_000_000_000_000,'Fecha, ubicación o importe inválidos.');if(leg.description!==undefined)require(typeof leg.description==='string'&&leg.description.length<=180,'Descripción vinculada inválida.');absoluteTotal+=Math.abs(leg.cents);require(Number.isSafeInteger(absoluteTotal),'El total excede la precisión monetaria permitida.');}
  const [a,b]=op.legs;
  if(linked){require(a.cents<0&&b.cents===-a.cents,'Las partes vinculadas deben tener el mismo importe.');if(op.kind==='transfer')require(a.location!==b.location&&a.date===b.date,'Transferencia incompleta.');else require(a.location===b.location&&a.date.slice(0,7)!==b.date.slice(0,7),'Pase entre meses inválido.');}
  else require(['expense','saving-out'].includes(op.kind)?a.cents<0:a.cents>0,'El signo del importe no corresponde al movimiento.');
  if(op.kind==='income')require(['own','contribution','loan'].includes(op.incomeSource),'Origen del ingreso inválido.');else require(op.incomeSource===undefined,'Solo los ingresos tienen origen.');
  if(op.incomeCategory!==undefined)require(op.kind==='income'&&((op.incomeSource==='own'&&['salary','mel','misa','extra'].includes(op.incomeCategory))||(op.incomeSource==='contribution'&&op.incomeCategory==='card-loan')),'Detalle del ingreso propio inválido.');
  if(op.kind==='expense')require(ids.has(op.categoryId),'El gasto necesita una categoría válida.');else require(op.categoryId===undefined,'Solo los gastos tienen categoría.');
 }
 require(new TextEncoder().encode(JSON.stringify(input)).length<=600000,'El registro alcanzó el límite de tamaño. Exportá una copia y consultá antes de agregar más movimientos.');
 return structuredClone(input);
}
const currencyFormatter=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2});
export function formatMoney(cents){require(Number.isSafeInteger(cents),'Importe monetario inválido.');const absolute=BigInt(Math.abs(cents)),whole=absolute/100n;const signValue=cents<0?(whole===0n?-0:-whole):whole;return currencyFormatter.formatToParts(signValue).map(part=>part.type==='fraction'?String(absolute%100n).padStart(2,'0'):part.value).join('');}
export function totals(ledger,month,location){let balance=0,income=0,contributions=0,expense=0,sent=0,returned=0;for(const op of ledger.operations)for(const leg of op.legs){if(leg.date.slice(0,7)!==month||(location&&leg.location!==location))continue;balance+=leg.cents;if(op.kind==='income'){if(['contribution','loan'].includes(op.incomeSource))contributions+=leg.cents;else if(op.incomeSource==='own')income+=leg.cents;}if(op.kind==='expense')expense-=leg.cents;if(op.kind==='saving-out')sent-=leg.cents;if(op.kind==='saving-in')returned+=leg.cents;}return {balance,income,contributions,expense,sent,returned,savings:sent-returned,netExpense:expense-contributions};}
export function ownIncomeCategory(op){
 if(['salary','mel','misa','extra'].includes(op.incomeCategory))return op.incomeCategory;
 const description=String(op.description||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/\bsueldo\s+diario\b/.test(description))return 'salary';
 if(/\b(?:mel|melanie|melani)\b/.test(description))return 'mel';
 if(/\bmisa\b/.test(description))return 'misa';
 return 'extra';
}
export function monthlySummary(ledger,month){
 const result={...totals(ledger,month),salary:0,mel:0,misa:0,extra:0};
 for(const op of ledger.operations){if(op.kind!=='income')continue;for(const leg of op.legs){if(leg.date.slice(0,7)!==month)continue;if(op.incomeSource==='own')result[ownIncomeCategory(op)]+=leg.cents;}}
 return result;
}
export async function checksum(data){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function makeBackup(state){const ledger=validateLedger(state.ledger);const data={operations:ledger.operations,categories:ledger.categories,cases:[],templates:[]};return {format:'control-gastos-backup',schemaVersion:1,mode:'financial',complete:true,source:'firestore',revision:state.revision,snapshotId:crypto.randomUUID(),createdAt:new Date().toISOString(),timeZone:'America/Argentina/Buenos_Aires',data,checksum:await checksum(data)};}
export async function validateBackup(backup){
 require(plain(backup)&&backup.format==='control-gastos-backup'&&backup.schemaVersion===1&&backup.mode==='financial'&&backup.complete===true&&backup.source==='firestore'&&backup.timeZone==='America/Argentina/Buenos_Aires'&&Number.isSafeInteger(backup.revision)&&backup.revision>=0&&validId(backup.snapshotId)&&typeof backup.createdAt==='string'&&Number.isFinite(Date.parse(backup.createdAt)),'Esta copia no corresponde a movimientos de Gastos. Las copias de la prueba ficticia no se importan aquí.');
 keys(backup.data,['operations','categories','cases','templates']);require(Array.isArray(backup.data.cases)&&backup.data.cases.length===0&&Array.isArray(backup.data.templates)&&backup.data.templates.length===0,'El formato de la copia no es compatible.');
 require(backup.checksum===await checksum(backup.data),'La integridad de la copia no coincide. No se restauró.');return validateLedger({operations:backup.data.operations,categories:backup.data.categories});
}
