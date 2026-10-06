// Account controls stay out of the financial screens; no financial data is stored here.
const panel=document.querySelector('.live-access');
const toggle=document.getElementById('open-account');
const status=document.getElementById('app-status');
const summary=document.getElementById('connection-summary');
let expanded=false,installPrompt=null;
function paint(){
 const message=status.textContent.trim();
 const connected=/confirmad|Cuenta conectada/.test(message);
 const waiting=/Preparando|Comprobando|Guardando|Conservando/.test(message);
 const signedOut=!document.getElementById('app-login').hidden;
 summary.textContent=connected?'Conectado':waiting?'Conectando…':signedOut?'Sin sesión':'Revisá la conexión';
 if(/Guardando/.test(message))summary.textContent='Guardando…';
 summary.dataset.state=connected?'connected':waiting?'waiting':'attention';
 toggle.dataset.state=summary.dataset.state;
 toggle.title=message;
 const needsAttention=!connected&&!waiting&&!signedOut;
 panel.hidden=!expanded&&!signedOut&&!needsAttention;
 toggle.setAttribute('aria-expanded',String(!panel.hidden));
}
toggle.addEventListener('click',()=>{expanded=!expanded;paint();});
new MutationObserver(paint).observe(status,{childList:true,characterData:true,subtree:true});
new MutationObserver(paint).observe(document.getElementById('app-login'),{attributes:true,attributeFilter:['hidden']});
paint();
const install=document.getElementById('install-app');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;install.hidden=false;});
install.addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;install.hidden=true;await prompt.prompt();await prompt.userChoice;});
window.addEventListener('appinstalled',()=>{installPrompt=null;install.hidden=true;});
