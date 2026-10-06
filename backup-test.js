import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, getDocFromServer, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { diagnosticData, checksum, validateDiagnosticBackup } from './backup-test-format.js';
const app = initializeApp({apiKey:'AIzaSyBB4GrQQeRwgQlJ_jFqMbJzRU4FOTaI1cw',authDomain:'control-de-gastos-72453.firebaseapp.com',projectId:'control-de-gastos-72453',appId:'1:585615744945:web:e720a412a6bbd7c6382790'});
const auth = getAuth(app), db = getFirestore(app);
const status = document.getElementById('firebase-test-status');
const restoreStatus = document.getElementById('restore-test-status');
const seed = document.getElementById('seed-test'), change = document.getElementById('change-test');
let user, busy = false;
function ref() { if (!user) throw new Error('Entrá primero con Google desde configuración.'); return doc(db,'users',user.uid,'diagnostics','backup-check'); }
function buttons() { seed.disabled = change.disabled = !user || busy; }
function report(error) { return error.code === 'permission-denied' ? 'Permiso denegado. Falta publicar las nuevas reglas de la prueba.' : error.message || 'No se pudo completar la prueba.'; }
function display(data) { status.textContent = `Firebase confirmado: $${(data.amountCents/100).toLocaleString('es-AR',{minimumFractionDigits:2})} ficticios · revisión ${data.revision}. El respaldo en Drive se informa por separado.`; }
async function current() { const snap=await getDocFromServer(ref()); if(!snap.exists())throw new Error('Primero guardá el importe ficticio.'); return snap.data(); }
async function snapshot() {
 const data=await current();
 const payload=diagnosticData(data.amountCents);
 return {format:'control-gastos-backup',schemaVersion:1,mode:'diagnostic-only',complete:true,source:'firestore',revision:data.revision,snapshotId:crypto.randomUUID(),createdAt:new Date().toISOString(),timeZone:'America/Argentina/Buenos_Aires',data:payload,checksum:await checksum(payload)};
}
async function update(amountCents, expectedRevision) {
 const reference=ref();
 await runTransaction(db,async tx=>{
  const snap=await tx.get(reference);const revision=snap.exists()?snap.data().revision:0;
  if(expectedRevision!==undefined && revision!==expectedRevision)throw new Error('Los datos cambiaron en otro dispositivo. Volvé a revisar la copia antes de restaurar.');
  tx.set(reference,{kind:'fictitious-backup-check',amountCents,revision:revision+1,updatedAt:serverTimestamp()});
 });
 const saved=await current();display(saved);window.DriveBackup.changed();
}
onAuthStateChanged(auth,async value=>{user=value;buttons();if(!user){status.textContent='Entrá con Google en la página de configuración y volvé aquí.';return;}try{display(await current());window.DriveBackup.changed();}catch(error){status.textContent=report(error);}});
window.DriveBackup.init({app:'gastos',getBackup:snapshot});
for(const [button,amount] of [[seed,12345],[change,54321]])button.addEventListener('click',async()=>{busy=true;buttons();try{await update(amount);}catch(error){status.textContent=report(error);}finally{busy=false;buttons();}});
window.addEventListener('gastos:restore-test',async event=>{
 if(busy)return;busy=true;buttons();
 try {
  const amount=await validateDiagnosticBackup(event.detail);const before=await current();
  if(!confirm(`Restaurar copia ficticia de revisión ${event.detail.revision} (${event.detail.createdAt}) con $${(amount/100).toFixed(2)} sobre la revisión actual ${before.revision}? Se creará antes una copia de seguridad del estado actual. No afecta registros reales ni otras apps.`)){restoreStatus.textContent='Restauración cancelada.';return;}
  const safety=await window.DriveBackup.request('/backups',await snapshot());
  if(safety.saved!==true || !safety.file?.id || !safety.file?.createdTime)throw new Error('No se confirmó la copia de seguridad previa. No se restauró.');
  await update(amount,before.revision);
  restoreStatus.textContent='Recuperación confirmada en Firebase; copia previa conservada en Drive. Esperá la nueva copia automática de lo restaurado.';
 }catch(error){restoreStatus.textContent=report(error);}finally{busy=false;buttons();}
});
