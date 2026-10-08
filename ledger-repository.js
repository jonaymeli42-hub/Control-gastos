import {emptyLedger,validateLedger} from './ledger-model.js?v=card-payment-loans-1';
export class Conflict extends Error {constructor(){super('Los datos cambiaron en otro dispositivo. Revisá la versión actual y volvé a editar.');this.code='ledger/conflict';}}
// A whole ledger is one atomic document: no partial transfers or torn backups.
export function createLedgerRepository(db,uid,sdk){
 const reference=sdk.doc(db,'users',uid,'financial','ledger');
 function decode(snapshot){if(!snapshot.exists())return {revision:0,ledger:emptyLedger()};const data=snapshot.data();if(data.schemaVersion!==1||!Number.isSafeInteger(data.revision)||data.revision<1)throw new Error('Formato de datos no reconocido. No se modificó.');return {revision:data.revision,ledger:validateLedger(data.ledger),lastMutationId:data.lastMutationId};}
 async function read(){return decode(await sdk.getDocFromServer(reference));}
 async function save(ledger,expectedRevision,mutationId){
  const validated=validateLedger(ledger);
  try{return await sdk.runTransaction(db,async tx=>{const snap=await tx.get(reference),current=decode(snap);if(current.lastMutationId===mutationId)return current;if(current.revision!==expectedRevision)throw new Conflict();const next={schemaVersion:1,revision:current.revision+1,lastMutationId:mutationId,ledger:validated,updatedAt:sdk.serverTimestamp()};tx.set(reference,next);return {revision:next.revision,ledger:validated,lastMutationId:mutationId};});}
  catch(error){
   // A simultaneous commit may fail the revision rule before the SDK retries.
   // A lost response can also follow a successful commit. Confirm on the server.
   try{const current=await read();if(current.lastMutationId===mutationId)return current;if(current.revision!==expectedRevision)throw new Conflict();}catch(readError){if(readError instanceof Conflict)throw readError;}
   throw error;
  }
 }
 function watch(onState,onError){return sdk.onSnapshot(reference,{includeMetadataChanges:true},snapshot=>{if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;try{onState(decode(snapshot));}catch(error){onError(error);}},onError);}
 return {read,save,watch};
}
