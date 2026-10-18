import {showNativeReturn} from './native-note-bridge.js?v=1';
import {parseVoiceExpense} from './voice-expense-parser.js?v=1';
import {createPendingExpenseStore,SHARED_PENDING_KEY} from './pending-expenses.js?v=native-1';
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initVoiceExpense({getCategories=()=>[],getToday=()=>new Date(Date.now()-3*3600000).toISOString().slice(0,10),onReview,currentApp='gastos'}){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const key=document.body.dataset.appMode==='live'?SHARED_PENDING_KEY:'control-gastos-demo-pending-expenses-v1';
 const store=createPendingExpenseStore(localStorage,key);
 const dialog=document.createElement('dialog');dialog.id='voice-expense';dialog.setAttribute('aria-labelledby','voice-title');
 dialog.innerHTML=`<div class="dialog-title"><h2 id="voice-title">Anotar para después</h2><button type="button" id="voice-close" aria-label="Cerrar">×</button></div><p class="muted">Decí algo corto: «6.700 en el kiosco».</p><button type="button" id="voice-record" class="primary">🎙 Dictar nota</button><p id="voice-status" role="status" aria-live="polite"></p><label for="voice-text">Tu nota</label><textarea id="voice-text" rows="3" maxlength="1000" placeholder="6.700 en el kiosco"></textarea><button type="button" id="voice-save" class="primary">Listo</button><button type="button" id="voice-inbox" class="action">Ver pendientes</button><p class="muted">Se guarda sola al dictar. No cambia tus saldos. Después completás el gasto desde Pendientes.</p>`;
 const inbox=document.createElement('dialog');inbox.id='pending-expenses';inbox.setAttribute('aria-labelledby','pending-title');
 inbox.innerHTML=`<div class="dialog-title"><h2 id="pending-title">Gastos pendientes</h2><button type="button" id="pending-close" aria-label="Cerrar">×</button></div><p class="muted">La misma lista para Control Gastos y Control Tarjetas, en este teléfono. Elegí dónde registrar cada nota cuando tengas tiempo.</p><p id="pending-status" role="status"></p><div id="pending-list"></div>`;
 document.body.append(dialog,inbox);
 const find=id=>dialog.querySelector('#'+id),record=find('voice-record'),status=find('voice-status'),text=find('voice-text');
 let recognition=null,timer=null,typingTimer=null,listening=false,generation=0,note=null,heard=false,savedText='',closeRequested=false,afterClose=null;
 function count(){try{return store.read().notes.length;}catch{return 0;}}
 function refresh(){for(const node of document.querySelectorAll('[data-pending-expense-count]'))node.textContent=String(count());}
 function changed(){refresh();if(document.body.dataset.appMode==='live')window.DriveBackup?.changed();window.dispatchEvent(new Event('gastos:pending-expenses-change'));}
 function saveNote(){
  clearTimeout(typingTimer);const value=text.value.trim();if(!value)return true;
  try{store.upsert({...note,text:value});savedText=value;changed();return true;}catch{status.textContent='No pude guardar la nota en este teléfono. Copiá el texto y reintentá; no cierres esta ventana todavía.';return false;}
 }
 function stop(abort=false){clearTimeout(timer);if(recognition){try{abort?recognition.abort():recognition.stop();}catch{}}}
 function reset(){listening=false;record.textContent=savedText?'🎙 Dictar otra nota':'🎙 Volver a dictar';}
 function finish(){clearTimeout(timer);reset();if(heard&&saveNote())status.textContent='✓ Guardado en pendientes. Podés cerrar y seguir después.';}
 function close(){generation++;stop(true);recognition=null;reset();clearTimeout(typingTimer);}
 function closeSafely(next){if(listening){closeRequested=true;afterClose=typeof next==='function'?next:null;status.textContent='Terminando y guardando la nota…';stop();return false;}if(!saveNote())return false;dialog.close();if(typeof next==='function')next();return true;}
 dialog.addEventListener('close',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeSafely();});find('voice-close').onclick=()=>closeSafely();
 text.addEventListener('input',()=>{clearTimeout(typingTimer);typingTimer=setTimeout(()=>{if(saveNote())status.textContent='✓ Guardado en pendientes.';},350);});
 find('voice-save').onclick=()=>{if(!text.value.trim()&&!listening){status.textContent='Dictá o escribí una nota primero.';text.focus();return;}closeSafely();};
 record.onclick=()=>{
  if(listening){status.textContent='Terminando…';stop();return;}
  if(!Recognition){status.textContent='Usá el micrófono del teclado del celular o escribí la nota abajo. Se guarda para después.';text.focus();return;}
  // A new dictation is a new note; already captured notes stay in the inbox.
  if(savedText){note=newNote();text.value='';savedText='';}
  const session=++generation;heard=false;
  try{
   recognition=new Recognition();recognition.lang='es-AR';recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
   recognition.onstart=()=>{if(session!==generation)return;listening=true;record.textContent='■ Terminar';status.textContent='Escuchando… Por ejemplo: «6.700 en el kiosco».';};
   recognition.onresult=event=>{if(session!==generation||!dialog.open)return;const words=Array.from(event.results).map(result=>result[0]?.transcript||'').join(' ').trim();if(words){heard=true;text.value=words.slice(0,1000);saveNote();}};
   recognition.onerror=event=>{if(session!==generation)return;const messages={'not-allowed':'Permití el micrófono en Chrome o usá el micrófono del teclado.','service-not-allowed':'Usá el micrófono del teclado o escribí tu nota.','audio-capture':'No pude acceder al micrófono. Podés escribir la nota.','no-speech':'No escuché la nota. Tocá Volver a dictar.','network':'El dictado necesita conexión. Podés escribir la nota y guardarla igualmente.','language-not-supported':'Podés usar el micrófono del teclado o escribir la nota.'};status.textContent=messages[event.error]||'Se interrumpió el dictado. Podés escribir o volver a dictar.';clearTimeout(timer);reset();if(heard)finish();};
   recognition.onend=()=>{if(session!==generation)return;finish();if(!heard&&(status.textContent.startsWith('Escuchando')||status.textContent.startsWith('Terminando')))status.textContent='No escuché la nota. Podés volver a dictar o escribirla.';if(closeRequested){closeRequested=false;const next=afterClose;afterClose=null;closeSafely(next);}};
   recognition.start();listening=true;record.textContent='■ Terminar';timer=setTimeout(()=>stop(),30000);
  }catch{reset();status.textContent='No pude iniciar el micrófono. Usá el del teclado o escribí la nota.';}
 };
 function newNote(){return {id:crypto.randomUUID(),createdAt:new Date().toISOString(),date:getToday(),text:''};}
 function open(listen){if(dialog.open)return;note=newNote();text.value='';savedText='';heard=false;closeRequested=false;afterClose=null;status.textContent=Recognition?'Tocá Dictar nota. No hace falta elegir categoría ni Efectivo o Virtual.':'Escribí tu nota o usá el micrófono del teclado.';record.textContent='🎙 Dictar nota';dialog.showModal();if(listen)record.click();}
 function showInbox(){
  inbox.querySelector('#pending-status').textContent='';
  try{const notes=store.read().notes.slice().reverse();inbox.querySelector('#pending-list').innerHTML=notes.length?notes.map(n=>`<article class="pending-note"><p>${escape(n.text)}</p><small>${escape(new Date(n.createdAt).toLocaleString('es-AR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))}</small><div class="pending-note-actions"><button type="button" class="primary" data-review-note="${escape(n.id)}">Revisar y registrar</button><button type="button" class="action" data-discard-note="${escape(n.id)}">Descartar</button></div><div class="pending-targets" hidden><p>¿Dónde querés registrar esta nota?</p><button type="button" class="action" data-target-note="${escape(n.id)}" data-target="gastos">Control Gastos · gasto diario</button><button type="button" class="action" data-target-note="${escape(n.id)}" data-target="card-one">Control Tarjetas · un pago</button><button type="button" class="action" data-target-note="${escape(n.id)}" data-target="card-quota">Control Tarjetas · cuotas</button></div></article>`).join(''):'<p class="empty">No tenés gastos pendientes.</p>';}catch{inbox.querySelector('#pending-status').textContent='No pude leer las notas pendientes. No se modificó ningún dato.';}
  if(!inbox.open)inbox.showModal();
 }
 find('voice-inbox').onclick=()=>closeSafely(showInbox);inbox.querySelector('#pending-close').onclick=()=>inbox.close();
 function reviewNote(id){
  const n=store.read().notes.find(n=>n.id===id);if(!n)return false;
  const draft=parseVoiceExpense(n.text,getCategories(),n.date);inbox.close();
  if(!onReview?.(draft,n.id)){showInbox();inbox.querySelector('#pending-status').textContent='Conectá tu cuenta y esperá a que se confirme el acceso para registrar el gasto. La nota sigue guardada.';return false;}return true;
 }
 inbox.addEventListener('click',event=>{
  const review=event.target.closest('[data-review-note]'),discard=event.target.closest('[data-discard-note]'),target=event.target.closest('[data-target-note]');if(!review&&!discard&&!target)return;
  try{
   const id=review?.dataset.reviewNote||discard?.dataset.discardNote||target.dataset.targetNote,n=store.read().notes.find(n=>n.id===id);if(!n)return showInbox();
   if(discard){if(!confirm('¿Descartar esta nota pendiente? No modifica ningún gasto registrado.'))return;store.remove(id);changed();showInbox();return;}
   if(review){const choices=review.closest('article').querySelector('.pending-targets');choices.hidden=false;choices.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
   if(target.dataset.target==='gastos'&&currentApp==='gastos'){reviewNote(n.id);return;}
   const route=target.dataset.target==='gastos'?'/Control-gastos/instalar.html':'/Control-tarjetas/index.html';
   const url=new URL(route,location.origin);url.searchParams.set('nota',n.id);
   if(target.dataset.target!=='gastos')url.searchParams.set('screen',target.dataset.target==='card-one'?'oneAddScreen':'addScreen');
   location.href=url.href;
  }catch{inbox.querySelector('#pending-status').textContent='No pude abrir esta nota. Sigue guardada para revisar después.';}
 });
 document.addEventListener('click',event=>{if(event.target.closest('[data-pending-expenses]'))showInbox();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open){saveNote();if(listening)stop();}});
 window.addEventListener('storage',event=>{if(event.key===key){refresh();if(inbox.open)showInbox();}});
 refresh();
 const action=new URLSearchParams(location.search).get('accion');if(action==='audio'||action==='nota'||action==='pendientes'){showInbox();const url=new URL(location.href);url.searchParams.delete('accion');history.replaceState(null,'',url);}
 return {count,refresh,review:reviewNote,complete(id){const note=store.read().notes.find(n=>n.id===id);store.remove(id);changed();if(currentApp==='gastos')showNativeReturn(note,'gastos');},exportData:()=>store.read(),restoreData(book){store.restore(book);changed();if(inbox.open)showInbox();}};
}
