// Reference supplied by the user on 2026-10-06; indentation normalized.
// Secrets belong in Cloudflare settings, never in this file.
const ORIGIN = 'https://jonaymeli42-hub.github.io';
const APPS = { prestamos: '/Control-prestamos/', tarjetas: '/Control-tarjetas/' };
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const unb64 = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
const random = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const digest = async value => b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
class Failure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function check(ok, status, message) { if (!ok) throw new Failure(status, message); }
function response(body, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': ORIGIN, 'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff'
  } });
}
async function seal(env, object) {
  const key = await crypto.subtle.importKey('raw', unb64(env.ENCRYPTION_KEY), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(object)));
  return JSON.stringify({ iv: b64(iv), value: b64(new Uint8Array(bytes)) });
}
async function open(env, value) {
  const object = JSON.parse(value);
  const key = await crypto.subtle.importKey('raw', unb64(env.ENCRYPTION_KEY), 'AES-GCM', false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(object.iv) }, key, unb64(object.value))));
}
async function jsonBody(request) {
  check(request.headers.get('content-type')?.startsWith('application/json'), 415, 'Se requiere JSON.');
  const reader = request.body?.getReader(); check(reader, 400, 'Falta el contenido.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 2_000_000) { await reader.cancel(); throw new Failure(413, 'Respaldo demasiado grande.'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(all)); } catch { throw new Failure(400, 'JSON inválido.'); }
}
async function googleToken(env, params) {
  const result = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, ...params }) });
  const token = await result.json(); check(result.ok && token.access_token, 401, 'Reconectá tu cuenta de Google.'); return token;
}
async function session(request, env) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  check(token, 401, 'Conectá tu cuenta primero.');
  const stored = await env.BACKUP_AUTH.get('session:' + await digest(token));
  check(stored, 401, 'La conexión venció. Volvé a conectar.');
  const grant = await open(env, stored);
  check(grant.expires > Date.now() && grant.email === env.ALLOWED_EMAIL.toLowerCase(), 401, 'La conexión venció.');
  return { grant, key: 'session:' + await digest(token) };
}
async function drive(access, path, options = {}) {
  const result = await fetch('https://www.googleapis.com/' + path, { ...options, headers: { ...options.headers, Authorization: 'Bearer ' + access } });
  check(result.ok, result.status === 401 ? 401 : 502, 'Google Drive no pudo completar la operación. Reintentá.'); return result.json();
}
async function list(access, app) {
  const params = new URLSearchParams({ spaces: 'appDataFolder', q: `trashed = false and appProperties has { key='backupApp' and value='${app}' }`, fields: 'files(id,name,createdTime,size),nextPageToken', orderBy: 'createdTime desc', pageSize: '100' });
  const result = await drive(access, 'drive/v3/files?' + params); return result.files || [];
}
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'OPTIONS') return response(null, 204);
      if (url.pathname === '/health') return response({ service: 'respaldo-mis-apps', configured: Boolean(env.BACKUP_AUTH && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.ENCRYPTION_KEY && env.ALLOWED_EMAIL) });
      check(env.BACKUP_AUTH && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.ENCRYPTION_KEY && env.ALLOWED_EMAIL, 503, 'El servicio todavía no está configurado.');
      const callback = url.origin + '/oauth/callback';
      if (url.pathname === '/oauth/callback' && request.method === 'GET') {
        const state = url.searchParams.get('state'); check(/^[A-Za-z0-9_-]{43}$/.test(state || ''), 400, 'Solicitud de conexión inválida.');
        const stored = await env.BACKUP_AUTH.get('state:' + state); check(stored, 400, 'La solicitud de conexión venció.');
        const pending = await open(env, stored); await env.BACKUP_AUTH.delete('state:' + state);
        check(pending.expires > Date.now() && url.searchParams.get('code'), 400, 'Conexión cancelada o vencida.');
        const token = await googleToken(env, { code: url.searchParams.get('code'), grant_type: 'authorization_code', redirect_uri: callback });
        check(token.refresh_token && token.scope?.split(' ').includes(DRIVE_SCOPE), 403, 'Falta autorizar el respaldo en Drive.');
        const identity = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + token.access_token } });
        const user = await identity.json();
        check(identity.ok && user.verified_email && user.email?.toLowerCase() === env.ALLOWED_EMAIL.toLowerCase(), 403, 'Usá la cuenta autorizada para estos respaldos.');
        const ticket = random();
        await env.BACKUP_AUTH.put('ticket:' + await digest(ticket), await seal(env, { email: user.email.toLowerCase(), refresh: token.refresh_token, app: pending.app, proof: pending.proof, expires: Date.now() + 300_000 }), { expirationTtl: 300 });
        return new Response(null, { status: 303, headers: { Location: ORIGIN + APPS[pending.app] + 'drive-callback.html#ticket=' + ticket, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
      }
      check(request.headers.get('origin') === ORIGIN, 403, 'Origen no autorizado.');
      if (url.pathname === '/auth/start' && request.method === 'POST') {
        const body = await jsonBody(request); check(Object.hasOwn(APPS, body.app) && /^[A-Za-z0-9_-]{43}$/.test(body.proof || ''), 400, 'Solicitud inválida.');
        const state = random();
        await env.BACKUP_AUTH.put('state:' + state, await seal(env, { app: body.app, proof: body.proof, expires: Date.now() + 600_000 }), { expirationTtl: 600 });
        const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: 'code', scope: 'openid email ' + DRIVE_SCOPE, access_type: 'offline', prompt: 'consent', state, login_hint: env.ALLOWED_EMAIL });
        return response({ url: 'https://accounts.google.com/o/oauth2/v2/auth?' + params });
      }
      if (url.pathname === '/auth/exchange' && request.method === 'POST') {
        const body = await jsonBody(request);
        check(/^[A-Za-z0-9_-]{43}$/.test(body.ticket || '') && /^[A-Za-z0-9_-]{43}$/.test(body.verifier || ''), 400, 'Conexión inválida.');
        const key = 'ticket:' + await digest(body.ticket); const stored = await env.BACKUP_AUTH.get(key); check(stored, 401, 'La conexión venció.');
        const grant = await open(env, stored); check(grant.expires > Date.now() && grant.proof === await digest(body.verifier), 401, 'Conexión inválida.');
        const bearer = random();
        await env.BACKUP_AUTH.put('session:' + await digest(bearer), await seal(env, { email: grant.email, refresh: grant.refresh, app: grant.app, expires: Date.now() + 180 * 86400_000 }), { expirationTtl: 180 * 86400 });
        await env.BACKUP_AUTH.delete(key); return response({ token: bearer, app: grant.app, email: grant.email });
      }
      const { grant, key } = await session(request, env);
      if (url.pathname === '/auth/disconnect' && request.method === 'POST') { await env.BACKUP_AUTH.delete(key); return response({ disconnected: true }); }
      check(['/backups', '/backups/download'].includes(url.pathname), 404, 'Ruta inexistente.');
      check(request.method === 'GET' || (url.pathname === '/backups' && request.method === 'POST'), 405, 'Método no permitido.');
      const token = await googleToken(env, { refresh_token: grant.refresh, grant_type: 'refresh_token' });
      if (url.pathname === '/backups/download') {
        const file = url.searchParams.get('id'); check(/^[A-Za-z0-9_-]{1,200}$/.test(file || ''), 400, 'Archivo inválido.');
        const meta = await drive(token.access_token, 'drive/v3/files/' + file + '?fields=appProperties');
        check(meta.appProperties?.backupApp === grant.app, 403, 'Archivo no autorizado.');
        return response(await drive(token.access_token, 'drive/v3/files/' + file + '?alt=media'));
      }
      if (request.method === 'GET') return response({ files: await list(token.access_token, grant.app) });
      const backup = await jsonBody(request);
      check(backup && typeof backup.data === 'object' && backup.data !== null && !Array.isArray(backup.data), 400, 'Respaldo inválido.');
      check(grant.app === 'prestamos' ? backup.format === 'control-prestamos-backup' && Array.isArray(backup.data.loans) : backup.app === 'Control de Tarjetas' && Array.isArray(backup.data.expenses), 400, 'El respaldo pertenece a otra app.');
      const name = `respaldo_${grant.app}_${new Date().toISOString().replaceAll(':', '-')}_${random().slice(0, 8)}.json`;
      const boundary = 'backup_' + random();
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: ['appDataFolder'], appProperties: { backupApp: grant.app } })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(backup)}\r\n--${boundary}--`;
      const file = await drive(token.access_token, 'upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body });
      return response({ saved: true, file });
    } catch (error) { return response({ error: error instanceof Failure ? error.message : 'No se pudo completar la operación. Reintentá.' }, error instanceof Failure ? error.status : 500); }
  }
};
