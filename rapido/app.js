import {initVoiceExpense} from '../voice-expense.js?v=native-1';
initVoiceExpense({currentApp:'hub'});
let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.getElementById('install-notes').hidden=false;});
document.getElementById('install-notes').onclick=async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;document.getElementById('install-notes').hidden=true;await prompt.prompt();};
window.addEventListener('appinstalled',()=>{document.getElementById('install-notes').hidden=true;document.getElementById('install-notes-help').textContent='Listo: usá el ícono Anotar gasto en la pantalla del teléfono.';});
if('serviceWorker' in navigator&&isSecureContext)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
