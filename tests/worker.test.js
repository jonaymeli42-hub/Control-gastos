import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';
const origin='https://jonaymeli42-hub.github.io';
const bearer='a'.repeat(43);
const key=Buffer.alloc(32,1);
const b64=v=>Buffer.from(v).toString('base64url');
const hash=async v=>b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
async function encrypted(value) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
 return JSON.stringify({iv:b64(iv),value:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(value))))});
}
let realFetch, calls, entries;
beforeEach(()=>{realFetch=globalThis.fetch;calls=[];entries=new Map();
 globalThis.fetch=async (url,opts={})=>{
  calls.push({url:String(url),opts});
  if(String(url).includes('oauth2.googleapis.com/token'))return Response.json({access_token:'fictitious-access'});
  if(String(url).includes('upload/drive/v3/files'))return Response.json({id:'fictitious-file',name:'copy.json',createdTime:'2026-10-06T00:00:00Z'});
  if(String(url).includes('fields=appProperties'))return Response.json({appProperties:{backupApp:'tarjetas'}});
  if(String(url).includes('alt=media'))return Response.json({data:{expenses:[]}});
  return Response.json({files:[]});
 };
});
afterEach(()=>{globalThis.fetch=realFetch;});
async function env(app='gastos') {
 entries.set('session:'+await hash(bearer),await encrypted({app,email:'owner@example.invalid',refresh:'fictitious-refresh',expires:Date.now()+100000}));
 return {ENCRYPTION_KEY:b64(key),ALLOWED_EMAIL:'owner@example.invalid',GOOGLE_CLIENT_ID:'fictitious-client',GOOGLE_CLIENT_SECRET:'fictitious-secret',BACKUP_AUTH:{get:async k=>entries.get(k),put:async(k,v)=>entries.set(k,v),delete:async k=>entries.delete(k)}};
}
const gastos=()=>({format:'control-gastos-backup',schemaVersion:1,complete:true,source:'firestore',revision:2,snapshotId:'fake-snapshot-2',createdAt:'2026-10-06T12:00:00Z',timeZone:'America/Argentina/Buenos_Aires',data:{operations:[],cases:[],templates:[]}});
function req(path,body,overrides={}) { return new Request('https://worker.example'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer '+bearer,...(body===undefined?{}:{'Content-Type':'application/json'}),...overrides},body:body===undefined?undefined:JSON.stringify(body)}); }
test('new gastos upload stays isolated and uses creation only',async()=>{
 const r=await worker.fetch(req('/backups',gastos()),await env());assert.equal(r.status,200);assert.equal((await r.json()).saved,true);
 const upload=calls.find(c=>c.url.includes('upload/'));assert.equal(upload.opts.method,'POST');assert.match(upload.opts.body,/"backupApp":"gastos"/);assert.match(upload.opts.body,/"parents":\["appDataFolder"\]/);assert.match(upload.opts.body,/respaldo_gastos_/);assert.equal(calls.some(c=>['DELETE','PATCH'].includes(c.opts.method)),false);
});
test('existing prestamos and tarjetas formats remain accepted',async()=>{
 for(const [app,backup] of [['prestamos',{format:'control-prestamos-backup',data:{loans:[]}}],['tarjetas',{app:'Control de Tarjetas',data:{expenses:[]}}]])assert.equal((await worker.fetch(req('/backups',backup),await env(app))).status,200);
});
test('cross-app and incomplete or malformed gastos copies rejected',async()=>{
 for(const backup of [{app:'Control de Tarjetas',data:{expenses:[]}},{...gastos(),complete:false},{...gastos(),revision:-1},{...gastos(),data:{operations:[]}},{...gastos(),schemaVersion:2}])assert.equal((await worker.fetch(req('/backups',backup),await env())).status,400);
 assert.equal((await worker.fetch(req('/backups',gastos()),await env('prestamos'))).status,400);
});
test('listing scopes gastos; no existing copies removed',async()=>{
 assert.equal((await worker.fetch(req('/backups'),await env())).status,200);
 const call=calls.find(c=>c.url.includes('drive/v3/files?'));const u=new URL(call.url);assert.equal(u.searchParams.get('spaces'),'appDataFolder');assert.match(u.searchParams.get('q'),/value='gastos'/);
});
test('gastos session cannot download tarjetas file; tarjetas can',async()=>{
 assert.equal((await worker.fetch(req('/backups/download?id=fake'),await env())).status,403);assert.equal(calls.some(c=>c.url.includes('alt=media')),false);
 assert.equal((await worker.fetch(req('/backups/download?id=fake'),await env('tarjetas'))).status,200);
});
test('origin and missing authorization rejected',async()=>{
 assert.equal((await worker.fetch(req('/backups',undefined,{Origin:'https://other.example'}),await env())).status,403);
 assert.equal((await worker.fetch(req('/backups',undefined,{Authorization:''}),await env())).status,401);
});
test('oauth start supports all three identifiers without changing Google scopes',async()=>{
 for(const app of ['prestamos','tarjetas','gastos']){
  const r=await worker.fetch(req('/auth/start',{app,proof:'b'.repeat(43)}),await env());assert.equal(r.status,200);
  const u=new URL((await r.json()).url);assert.equal(u.searchParams.get('scope'),'openid email https://www.googleapis.com/auth/drive.appdata');assert.equal(u.searchParams.get('redirect_uri'),'https://worker.example/oauth/callback');
 }
 assert.equal((await worker.fetch(req('/auth/start',{app:'unknown',proof:'b'.repeat(43)}),await env())).status,400);
});
