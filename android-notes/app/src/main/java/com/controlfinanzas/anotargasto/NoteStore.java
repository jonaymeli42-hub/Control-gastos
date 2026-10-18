package com.controlfinanzas.anotargasto;
import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
public final class NoteStore {
 private final SharedPreferences preferences;
 public NoteStore(Context context){preferences=context.getSharedPreferences("private_notes_v1",Context.MODE_PRIVATE);}
 public JSONArray all(){try{return new JSONArray(preferences.getString("notes","[]"));}catch(Exception e){throw new IllegalStateException("No pude leer las notas. No se reemplazó ningún dato.");}}
 private void write(JSONArray notes){if(!preferences.edit().putString("notes",notes.toString()).commit())throw new IllegalStateException("No pude guardar la nota. No cierres la app todavía.");}
 public JSONObject find(String id){JSONArray notes=all();for(int i=0;i<notes.length();i++){JSONObject n=notes.optJSONObject(i);if(n!=null&&id.equals(n.optString("id")))return n;}return null;}
 public void save(String id,String text,String createdAt,String date,String token){if(!NoteRules.validId(id)||!NoteRules.validText(text)||!NoteRules.validToken(token))throw new IllegalArgumentException("Revisá el texto de la nota.");try{
  JSONArray notes=all();for(int i=0;i<notes.length();i++){JSONObject n=notes.getJSONObject(i);if(id.equals(n.optString("id"))){n.put("text",text.trim());write(notes);return;}}
  JSONObject n=new JSONObject();n.put("id",id);n.put("text",text.trim());n.put("createdAt",createdAt);n.put("date",date);n.put("nativeReceipt",token);n.put("status","pending");notes.put(n);write(notes);
 }catch(IllegalStateException e){throw e;}catch(Exception e){throw new IllegalStateException("No pude guardar la nota.");}}
 public void remove(String id){JSONArray source=all(),next=new JSONArray();for(int i=0;i<source.length();i++){JSONObject n=source.optJSONObject(i);if(n!=null&&!id.equals(n.optString("id")))next.put(n);}write(next);}
 public boolean acknowledge(String id,String token,String target){try{JSONArray notes=all();for(int i=0;i<notes.length();i++){JSONObject n=notes.getJSONObject(i);if(id.equals(n.optString("id"))&&NoteRules.sameToken(n.optString("nativeReceipt"),token)){n.put("status","registered");n.put("destination",NoteRules.destination(target));write(notes);return true;}}return false;}catch(Exception e){return false;}}
 public int count(boolean registered){JSONArray notes=all();int count=0;for(int i=0;i<notes.length();i++)if(notes.optJSONObject(i)!=null&&"registered".equals(notes.optJSONObject(i).optString("status"))==registered)count++;return count;}
 public JSONObject bridgeNote(String id){JSONObject n=find(id);if(n==null)throw new IllegalArgumentException("No encontré esta nota.");try{JSONObject out=new JSONObject();for(String key:new String[]{"id","text","createdAt","date","nativeReceipt"})out.put(key,n.getString(key));return out;}catch(Exception e){throw new IllegalStateException("No pude preparar la nota.");}}
}
