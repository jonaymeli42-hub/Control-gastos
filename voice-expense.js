import {parseVoiceExpense} from './voice-expense-parser.js?v=1';
export function initVoiceExpense({getCategories,getToday,onReview}){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const dialog=document.createElement('dialog');dialog.id='voice-expense';dialog.setAttribute('aria-labelledby','voice-title');
 dialog.innerHTML=`<div class="dialog-title"><h2 id="voice-title">Gasto por audio</h2><button type="button" id="voice-close" aria-label="Cerrar">×</button></div><p class="muted">Dictá un gasto por vez. Por ejemplo: «Gasté 8.500 pesos en supermercado, de efectivo».</p><button type="button" id="voice-record" class="primary">🎙 Dictar gasto</button><p id="voice-status" role="status" aria-live="polite"></p><label for="voice-text">Lo que dijiste <span class="muted">(podés corregirlo)</span></label><textarea id="voice-text" rows="3" maxlength="1000" placeholder="Gasté 8.500 pesos en supermercado, de efectivo"></textarea><button type="button" id="voice-review" class="primary">Revisar gasto ›</button><p class="muted">Se guarda recién cuando revisás los datos y tocás Guardar. El dictado usa el reconocimiento de voz del navegador y puede necesitar Internet.</p><p><a id="voice-link">Abrir acceso directo a audio ›</a></p><p class="muted">En Android, mantené presionado el ícono de Control Gastos y buscá «Gasto por audio». La opción puede tardar en aparecer.</p>`;
 document.body.append(dialog);
 const find=id=>dialog.querySelector('#'+id),record=find('voice-record'),status=find('voice-status'),text=find('voice-text'),review=find('voice-review');
 const link=new URL(document.body.dataset.appMode==='live'?'./instalar.html':'./demo.html',document.baseURI);link.searchParams.set('accion','audio');find('voice-link').href=link.href;
 let recognition=null,timer=null,listening=false,generation=0;
 function stop(abort=false){clearTimeout(timer);if(recognition){try{abort?recognition.abort():recognition.stop();}catch{}}}
 function reset(){listening=false;record.textContent='🎙 Volver a dictar';review.disabled=false;}
 function close(){generation++;stop(true);recognition=null;reset();}
 dialog.addEventListener('close',close);
 dialog.addEventListener('cancel',()=>close());
 find('voice-close').onclick=()=>dialog.close();
 record.onclick=()=>{
  if(listening){status.textContent='Terminando el dictado…';stop();return;}
  if(!Recognition){status.textContent='Este navegador no ofrece dictado. Podés escribir abajo o usar el micrófono del teclado del celular.';text.focus();return;}
  const session=++generation;let heard=false;const previous=text.value;
  try{
   recognition=new Recognition();recognition.lang='es-AR';recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
   recognition.onstart=()=>{if(session!==generation)return;listening=true;record.textContent='■ Terminar dictado';review.disabled=true;status.textContent='Escuchando… Decí el importe, el gasto y Efectivo o Virtual.';};
   recognition.onresult=event=>{if(session!==generation||!dialog.open)return;const words=Array.from(event.results).map(result=>result[0]?.transcript||'').join(' ').trim();if(words){heard=true;text.value=words.slice(0,1000);}};
   recognition.onerror=event=>{if(session!==generation)return;const messages={'not-allowed':'Permití el micrófono en Chrome para dictar. También podés escribir el gasto abajo.','service-not-allowed':'El dictado no está disponible en este navegador. Probá en Chrome o usá el micrófono del teclado.','audio-capture':'No pude acceder al micrófono. Revisá que no esté ocupado por otra app.','no-speech':'No escuché el gasto. Tocá Volver a dictar y probá de nuevo.','network':'No pude completar el dictado. Revisá Internet y reintentá.','language-not-supported':'No está disponible el dictado en español. Podés escribir o usar el micrófono del teclado.'};status.textContent=messages[event.error]||'El dictado se interrumpió. Podés reintentarlo o escribir el gasto.';clearTimeout(timer);reset();};
   recognition.onend=()=>{if(session!==generation)return;clearTimeout(timer);reset();if(heard)status.textContent='Revisá lo que se escuchó y tocá Revisar gasto.';else if(status.textContent.startsWith('Escuchando')||status.textContent.startsWith('Terminando')){text.value=previous;status.textContent='No escuché el gasto. Podés volver a dictar o escribirlo.';}};
   recognition.start();listening=true;record.textContent='■ Terminar dictado';review.disabled=true;timer=setTimeout(()=>stop(),30000);
  }catch{reset();status.textContent='No pude iniciar el micrófono. Reintentá o escribí el gasto abajo.';}
 };
 review.onclick=()=>{
  if(listening)return;if(!text.value.trim()){status.textContent='Primero dictá o escribí el gasto.';text.focus();return;}
  const draft=parseVoiceExpense(text.value,getCategories(),getToday());
  // Close the composer before showing the ordinary expense review dialog.
  const source=text.value;dialog.close();
  if(!onReview(draft)){dialog.showModal();text.value=source;status.textContent='Esperá a que se confirme la conexión de la app para revisar y guardar el gasto.';}
 };
 function open(listen){if(dialog.open)return;text.value='';status.textContent=Recognition?'Tocá Dictar gasto y permití el micrófono si te lo pide.':'Podés usar el micrófono del teclado o escribir el gasto abajo.';record.textContent='🎙 Dictar gasto';review.disabled=false;dialog.showModal();if(listen)record.click();}
 document.addEventListener('click',event=>{if(event.target.closest('[data-voice-expense]'))open(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&listening)stop();});
 if(new URLSearchParams(location.search).get('accion')==='audio'){open(false);const url=new URL(location.href);url.searchParams.delete('accion');history.replaceState(null,'',url);}
}
