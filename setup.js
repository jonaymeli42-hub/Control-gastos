import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
// Public web connection configuration; access is controlled by server-side rules.
const app = initializeApp({
  apiKey: 'AIzaSyBB4GrQQeRwgQlJ_jFqMbJzRU4FOTaI1cw',
  authDomain: 'control-de-gastos-72453.firebaseapp.com',
  projectId: 'control-de-gastos-72453',
  storageBucket: 'control-de-gastos-72453.firebasestorage.app',
  messagingSenderId: '585615744945',
  appId: '1:585615744945:web:e720a412a6bbd7c6382790'
});
const auth = getAuth(app);
const login = document.getElementById('login');
const status = document.getElementById('status');
const account = document.getElementById('account');
const uid = document.getElementById('uid');
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
function failure(error) {
  const messages = {
    'auth/popup-blocked': 'El navegador bloqueó la ventana. Permití ventanas emergentes para esta página y volvé a intentar.',
    'auth/popup-closed-by-user': 'No se completó el inicio de sesión. Podés intentarlo otra vez.',
    'auth/cancelled-popup-request': 'Ya hay un inicio de sesión en curso.',
    'auth/unauthorized-domain': 'Este dominio todavía no está autorizado en Firebase Authentication.',
    'auth/operation-not-allowed': 'El proveedor Google no está habilitado en este proyecto.',
    'auth/network-request-failed': 'No se pudo conectar. Comprobá Internet e intentá otra vez.',
    'auth/web-storage-unsupported': 'El navegador no permite el almacenamiento necesario para iniciar sesión. Abrí esta página en Chrome o Safari.'
  };
  status.textContent = messages[error.code] || `No se pudo completar el acceso (${error.code || 'error desconocido'}). Contame este mensaje en Codex.`;
}
onAuthStateChanged(auth, user => {
  account.hidden = !user;
  login.hidden = !!user;
  uid.value = user?.uid || '';
  status.textContent = user ? 'Inicio de sesión confirmado. Todavía no se accedió a Firestore.' : 'Listo para entrar con Google.';
}, failure);
try { await setPersistence(auth, browserLocalPersistence); login.disabled = false; }
catch (error) { failure(error); }
login.addEventListener('click', async () => {
  login.disabled = true;
  status.textContent = 'Esperando que completes el acceso con Google…';
  try { await signInWithPopup(auth, provider); } catch (error) { failure(error); }
  finally { login.disabled = false; }
});
document.getElementById('logout').addEventListener('click', async () => { try { await signOut(auth); } catch (error) { failure(error); } });
document.getElementById('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(uid.value); status.textContent = 'Identificador copiado. Pegalo en esta conversación de Codex.'; }
  catch { uid.focus(); uid.select(); status.textContent = 'Mantené presionado el identificador para copiarlo.'; }
});

// No personal identifiers are embedded in this source.
const testButton = document.getElementById('test-access');
const testStatus = document.getElementById('test-status');
testButton.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) { testStatus.textContent = 'Primero entrá con Google.'; return; }
  testButton.disabled = true;
  testStatus.textContent = 'Comprobando acceso…';
  let saved = false;
  try {
    const { getFirestore, doc, setDoc, getDocFromServer, deleteDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const db = getFirestore(app);
    const ref = doc(db, 'users', user.uid, 'diagnostics', 'access-check');
    await setDoc(ref, {kind: 'fictitious-access-check', updatedAt: serverTimestamp()});
    saved = true;
    testStatus.textContent = 'Guardado confirmado en Firebase. Comprobando lectura…';
    const snapshot = await getDocFromServer(ref);
    if (!snapshot.exists() || snapshot.data().kind !== 'fictitious-access-check') throw new Error('invalid-diagnostic');
    await deleteDoc(ref);
    testStatus.textContent = 'Prueba completa: guardado y lectura confirmados en Firebase; registro ficticio eliminado. Todavía no se probó el respaldo en Drive.';
  } catch (error) {
    const detail = error.code === 'permission-denied' ? 'Permiso denegado: revisá las reglas publicadas y la configuración de la cuenta.' : `No se completó la prueba (${error.code || error.message || 'error'}).`;
    testStatus.textContent = (saved ? 'Firebase confirmó el guardado, pero falta completar lectura o limpieza. ' : '') + detail;
  } finally { testButton.disabled = false; }
});
