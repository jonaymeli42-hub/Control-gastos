package com.controlfinanzas.anotargasto.tests;
import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import com.controlfinanzas.anotargasto.MainActivity;
import com.controlfinanzas.anotargasto.NoteStore;
import org.json.JSONObject;
public class NativeTests extends Instrumentation {
 private static void check(boolean yes,String message){if(!yes)throw new AssertionError(message);}
 private EditText findEditor(View view){if(view instanceof EditText)return (EditText)view;if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++){EditText found=findEditor(g.getChildAt(i));if(found!=null)return found;}}return null;}
 private Button findButton(View view,String text){if(view instanceof Button&&text.contentEquals(((Button)view).getText()))return (Button)view;if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++){Button found=findButton(g.getChildAt(i),text);if(found!=null)return found;}}return null;}
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){Bundle result=new Bundle();try{
  getTargetContext().getSharedPreferences("private_notes_v1",0).edit().clear().commit();
  Intent launch=new Intent(getTargetContext(),MainActivity.class);launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);Activity activity=startActivitySync(launch);waitForIdleSync();
  runOnMainSync(()->{EditText editor=findEditor(activity.getWindow().getDecorView());check(editor!=null,"Native editor missing");editor.setText("6700 en el kiosco");});
  NoteStore store=new NoteStore(getTargetContext());check(store.count(false)==1,"Typing must save a pending note");JSONObject note=store.all().getJSONObject(0);String id=note.getString("id"),token=note.getString("nativeReceipt");check(note.getString("createdAt").endsWith("Z"),"Timestamp missing");check(new NoteStore(getTargetContext()).find(id)!=null,"Note must survive store recreation");
  runOnMainSync(()->{Button end=findButton(activity.getWindow().getDecorView(),"Terminar");check(end!=null,"Finish missing");end.performClick();});waitForIdleSync();
  final Uri[] launched=new Uri[1];ActivityMonitor monitor=new ActivityMonitor(){@Override public ActivityResult onStartActivity(Intent intent){if(Intent.ACTION_VIEW.equals(intent.getAction())){launched[0]=intent.getData();return new ActivityResult(Activity.RESULT_OK,null);}return null;}};addMonitor(monitor);
  runOnMainSync(()->{Button send=findButton(activity.getWindow().getDecorView(),"Control Gastos");check(send!=null,"Destination button missing");send.performClick();});waitForIdleSync();removeMonitor(monitor);
  check(launched[0]!=null,"Browser handoff missing");check("jonaymeli42-hub.github.io".equals(launched[0].getHost()),"Untrusted destination");check(id.equals(launched[0].getQueryParameter("nota")),"Wrong note ID");String fragment=launched[0].getEncodedFragment();check(fragment.startsWith("anotar="),"Wrong bridge fragment");JSONObject sent=new JSONObject(Uri.decode(fragment.substring(7)));check("6700 en el kiosco".equals(sent.getString("text")),"Note content changed");check(token.equals(sent.getString("nativeReceipt")),"Return token changed");check(store.count(false)==1,"Sending must not mark note registered");
  check(!store.acknowledge(id,"forged-token-1234567890","gastos"),"Wrong return token accepted");check(store.count(false)==1,"Bad receipt changed state");
  Intent receipt=new Intent(Intent.ACTION_VIEW,Uri.parse("anotargasto://registrado/"+id+"?token="+token+"&app=gastos"));runOnMainSync(()->callActivityOnNewIntent(activity,receipt));waitForIdleSync();check(store.count(false)==0&&store.count(true)==1,"Verified receipt must move note out of pending");
  runOnMainSync(()->activity.finish());result.putString("stream","PASS: native typing, persisted note, timestamp, Android browser handoff encoding, no completion on send, forged receipt rejection, verified receipt completion.\n");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("stream",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}}
}
