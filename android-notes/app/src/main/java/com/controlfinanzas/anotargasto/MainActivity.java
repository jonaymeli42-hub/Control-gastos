package com.controlfinanzas.anotargasto;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.text.Editable;
import android.text.InputFilter;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;

public class MainActivity extends Activity {
 private static final int BG=Color.rgb(17,26,34),PANEL=Color.rgb(30,43,56),MINT=Color.rgb(142,213,181),INK=Color.rgb(233,240,245),MUTED=Color.rgb(169,185,199);
 private NoteStore store;private LinearLayout root,content;private TextView status,stamp,pendingTab;private EditText editor;private MicView mic;private SpeechRecognizer recognizer;
 private final Handler handler=new Handler(Looper.getMainLooper());private boolean listening=false,showRegistered=false,onCapture=true,finishRequested=false,initializing=false;
 private int generation=0;private String noteId,createdAt,noteDate,receiptToken;private String storageError="";
 private final Runnable stopTimeout=()->stopListening(true);
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(BG);getWindow().setNavigationBarColor(BG);getWindow().getDecorView().setSystemUiVisibility(0);store=new NoteStore(this);
  root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(BG);setContentView(root);
  root.setOnApplyWindowInsetsListener((view,insets)->{if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets safe=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());view.setPadding(safe.left,safe.top,safe.right,safe.bottom);}else view.setPadding(0,insets.getSystemWindowInsetTop(),0,insets.getSystemWindowInsetBottom());return insets;});root.requestApplyInsets();
  if(handleReceipt(getIntent()))return;
  if(state!=null&&state.getBoolean("capture",true)){noteId=state.getString("noteId");createdAt=state.getString("createdAt");noteDate=state.getString("noteDate");receiptToken=state.getString("token");showCapture(state.getString("text",""),false);}
  else if(state!=null){showRegistered=state.getBoolean("registered",false);showInbox();}
  else{newNote();showCapture("",true);}
 }
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(handleReceipt(intent))return;destroyRecognition();newNote();showCapture("",true);}
 private boolean handleReceipt(Intent intent){Uri uri=intent==null?null:intent.getData();if(uri==null||!"anotargasto".equals(uri.getScheme())||!"registrado".equals(uri.getHost()))return false;
  destroyRecognition();String id=uri.getLastPathSegment(),token=uri.getQueryParameter("token");boolean done=id!=null&&store.acknowledge(id,token,uri.getQueryParameter("app"));editor=null;showRegistered=false;showInbox();Toast.makeText(this,done?"Gasto registrado. La nota salió de pendientes.":"No pude confirmar esta nota. Sigue pendiente.",Toast.LENGTH_LONG).show();return true;
 }
 private int dp(float n){return Math.round(n*getResources().getDisplayMetrics().density);}
 private GradientDrawable shape(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
 private TextView label(String value,int size,int color,boolean bold){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(color);if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return v;}
 private Button button(String value,boolean primary,Runnable action){Button b=new Button(this);b.setText(value);b.setTextSize(16);b.setAllCaps(false);b.setTextColor(primary?BG:INK);b.setBackground(shape(primary?MINT:PANEL,16));b.setMinHeight(dp(52));b.setPadding(dp(12),dp(8),dp(12),dp(8));b.setOnClickListener(v->action.run());return b;}
 private void space(LinearLayout into,int height){into.addView(new View(this),new LinearLayout.LayoutParams(1,dp(height)));}
 private LinearLayout.LayoutParams full(){return new LinearLayout.LayoutParams(-1,-2);}
 private void frame(String title){root.removeAllViews();LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);header.setPadding(dp(20),dp(14),dp(16),dp(10));TextView heading=label(title,25,INK,true);header.addView(heading,new LinearLayout.LayoutParams(0,-2,1));Button more=button("⋮",false,()->{});more.setContentDescription("Más opciones");more.setTextSize(25);header.addView(more,new LinearLayout.LayoutParams(dp(48),dp(48)));more.setOnClickListener(v->menu(more));root.addView(header);
  LinearLayout tabs=new LinearLayout(this);tabs.setPadding(dp(20),0,dp(20),dp(12));Button capture=button("Dictar",onCapture,()->{if(!saveEditor())return;destroyRecognition();newNote();showCapture("",true);});pendingTab=button("Pendientes ("+safeCount(false)+")",!onCapture,()->{if(!saveEditor())return;destroyRecognition();showRegistered=false;showInbox();});LinearLayout.LayoutParams tab=new LinearLayout.LayoutParams(0,dp(48),1);tabs.addView(capture,tab);LinearLayout.LayoutParams tab2=new LinearLayout.LayoutParams(0,dp(48),1);tab2.leftMargin=dp(10);tabs.addView(pendingTab,tab2);root.addView(tabs);
  ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(20),dp(10),dp(20),dp(24));scroll.addView(content);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
 }
 private int safeCount(boolean registered){try{return store.count(registered);}catch(Exception e){storageError=e.getMessage();return 0;}}
 private void updateCount(){if(pendingTab!=null)pendingTab.setText("Pendientes ("+safeCount(false)+")");}
 private String isoNow(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date());}
 private void newNote(){noteId="android_"+UUID.randomUUID();receiptToken=UUID.randomUUID().toString();createdAt=isoNow();noteDate=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date());}
 private String prettyDate(String value){try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));Date date=f.parse(value);return new SimpleDateFormat("d MMM yyyy · HH:mm",new Locale("es","AR")).format(date);}catch(Exception e){return value;}}
 private void showCapture(String text,boolean autoListen){onCapture=true;editor=null;frame("Anotar gasto");stamp=label(prettyDate(createdAt),15,MUTED,false);stamp.setGravity(Gravity.CENTER);content.addView(stamp,full());space(content,22);mic=new MicView();mic.setContentDescription("Dictar una nota");mic.setOnClickListener(v->{if(listening)stopListening(false);else startListening();});LinearLayout.LayoutParams icon=new LinearLayout.LayoutParams(dp(188),dp(188));icon.gravity=Gravity.CENTER;content.addView(mic,icon);space(content,18);status=label("Tocá el micrófono o escribí tu nota",18,INK,true);status.setGravity(Gravity.CENTER);content.addView(status,full());space(content,18);
  editor=new EditText(this);editor.setTextColor(INK);editor.setHintTextColor(MUTED);editor.setTextSize(22);editor.setHint("6.700 pesos en el kiosco");editor.setGravity(Gravity.TOP);editor.setMinLines(3);editor.setMaxLines(7);editor.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_FLAG_CAP_SENTENCES|android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE);editor.setFilters(new InputFilter[]{new InputFilter.LengthFilter(1000)});editor.setPadding(dp(16),dp(15),dp(16),dp(15));editor.setBackground(shape(PANEL,18));initializing=true;editor.setText(text);initializing=false;content.addView(editor,full());editor.addTextChangedListener(new TextWatcher(){public void beforeTextChanged(CharSequence s,int start,int count,int after){}public void onTextChanged(CharSequence s,int start,int before,int count){if(!initializing)saveEditor();}public void afterTextChanged(Editable s){}});space(content,12);TextView help=label("Se guarda como nota pendiente, con fecha y hora. Tus saldos no cambian.",14,MUTED,false);content.addView(help,full());space(content,22);content.addView(button("Terminar",true,()->{((InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(editor.getWindowToken(),0);if(listening){finishRequested=true;stopListening(true);}else if(saveEditor())showInbox();}),full());
  if(autoListen)handler.postDelayed(()->{if(onCapture&&!isFinishing())startListening();},200);
 }
 private boolean saveEditor(){if(editor==null||editor.getText().toString().trim().isEmpty())return true;try{store.save(noteId,editor.getText().toString(),createdAt,noteDate,receiptToken);updateCount();return true;}catch(Exception e){if(status!=null)status.setText(e.getMessage());return false;}}
 private void showInbox(){destroyRecognition();onCapture=false;editor=null;frame(showRegistered?"Notas registradas":"Notas pendientes");if(!storageError.isEmpty()){content.addView(label(storageError,16,INK,false));return;}JSONArray notes;try{notes=store.all();}catch(Exception e){content.addView(label(e.getMessage(),16,INK,false));return;}
  int shown=0;for(int i=notes.length()-1;i>=0;i--){JSONObject n=notes.optJSONObject(i);if(n==null||"registered".equals(n.optString("status"))!=showRegistered)continue;shown++;LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(16),dp(16),dp(16),dp(16));card.setBackground(shape(PANEL,20));TextView body=label(n.optString("text"),21,INK,true);card.addView(body);space(card,10);card.addView(label(prettyDate(n.optString("createdAt")),14,MUTED,false));space(card,10);
   if(showRegistered){card.addView(label("Registrada en "+n.optString("destination","la app"),15,MINT,true));}
   else{card.addView(label("Pendiente de revisar",14,MINT,true));space(card,14);card.addView(label("¿Dónde querés registrarlo?",16,INK,false));space(card,10);card.addView(button("Control Gastos",false,()->sendNote(n,"gastos")),full());space(card,8);card.addView(button("Control Tarjetas",false,()->new AlertDialog.Builder(this).setTitle("Control Tarjetas").setItems(new String[]{"Compra a un pago","Compra en cuotas"},(dialog,which)->sendNote(n,which==0?"card-one":"card-quota")).show()),full());space(card,12);LinearLayout actions=new LinearLayout(this);Button edit=button("Editar nota",false,()->editNote(n));Button discard=button("Descartar",false,()->new AlertDialog.Builder(this).setMessage("¿Descartar esta nota? No modifica las otras apps.").setNegativeButton("Cancelar",null).setPositiveButton("Descartar",(d,w)->{try{store.remove(n.optString("id"));showInbox();}catch(Exception e){toast(e.getMessage());}}).show());actions.addView(edit,new LinearLayout.LayoutParams(0,-2,1));LinearLayout.LayoutParams right=new LinearLayout.LayoutParams(0,-2,1);right.leftMargin=dp(8);actions.addView(discard,right);card.addView(actions);}
   content.addView(card,full());space(content,14);
  }
  if(shown==0){content.addView(label(showRegistered?"Todavía no hay notas registradas.":"No tenés notas pendientes. Tocá Dictar para anotar algo rápido.",18,MUTED,false));space(content,20);}
  content.addView(button(showRegistered?"Volver a pendientes":"Ver registradas ("+safeCount(true)+")",false,()->{showRegistered=!showRegistered;showInbox();}),full());space(content,16);content.addView(label("Se registra recién cuando confirmás en la app elegida. Después tocá “Volver a Anotar gasto” para confirmar el regreso.",14,MUTED,false));
 }
 private void editNote(JSONObject n){noteId=n.optString("id");createdAt=n.optString("createdAt");noteDate=n.optString("date");receiptToken=n.optString("nativeReceipt");showCapture(n.optString("text"),false);}
 private void sendNote(JSONObject note,String target){try{String id=note.getString("id");String root="https://jonaymeli42-hub.github.io/";Uri.Builder url=Uri.parse(root+("gastos".equals(target)?"Control-gastos/instalar.html":"Control-tarjetas/index.html")).buildUpon().appendQueryParameter("nota",id);if(!"gastos".equals(target))url.appendQueryParameter("screen","card-one".equals(target)?"oneAddScreen":"addScreen");url.encodedFragment("anotar="+Uri.encode(store.bridgeNote(id).toString()));Intent intent=new Intent(Intent.ACTION_VIEW,url.build());intent.addCategory(Intent.CATEGORY_BROWSABLE);try{Intent chrome=new Intent(intent);chrome.setPackage("com.android.chrome");startActivity(chrome);}catch(Exception unavailable){startActivity(intent);}toast("La nota sigue pendiente hasta confirmar el registro.");}catch(Exception e){toast("No pude abrir la app. La nota sigue guardada.");}}
 private void startListening(){if(!onCapture||listening)return;if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},7);return;}
  if(!SpeechRecognizer.isRecognitionAvailable(this)){status.setText("No hay dictado disponible. Podés escribir o usar el micrófono del teclado.");return;}
  destroyRecognition();final int session=++generation;finishRequested=false;recognizer=SpeechRecognizer.createSpeechRecognizer(this);recognizer.setRecognitionListener(new RecognitionListener(){
   private boolean current(){return generation==session&&onCapture;}
   public void onReadyForSpeech(Bundle params){if(current()){listening=true;status.setText("Te escucho…");mic.invalidate();}}
   public void onBeginningOfSpeech(){}public void onRmsChanged(float rms){}public void onBufferReceived(byte[] buffer){}public void onEndOfSpeech(){if(current())status.setText("Guardando la nota…");}
   private void words(Bundle bundle){if(!current()||editor==null)return;ArrayList<String> results=bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);if(results!=null&&!results.isEmpty()){editor.setText(results.get(0));editor.setSelection(editor.length());saveEditor();}}
   public void onResults(Bundle result){if(!current())return;words(result);handler.removeCallbacks(stopTimeout);listening=false;mic.invalidate();boolean done=finishRequested;finishRequested=false;if(saveEditor()){status.setText("Guardado como nota pendiente");if(done)showInbox();}}
   public void onPartialResults(Bundle partial){words(partial);}
   public void onError(int error){if(!current())return;handler.removeCallbacks(stopTimeout);listening=false;mic.invalidate();boolean done=finishRequested;finishRequested=false;saveEditor();String text=error==SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS?"Permití el micrófono o escribí la nota.":error==SpeechRecognizer.ERROR_NETWORK||error==SpeechRecognizer.ERROR_NETWORK_TIMEOUT?"El dictado necesita conexión. Podés escribir la nota.":"No pude escuchar la nota completa. Podés reintentar o escribirla.";status.setText(text);if(done&&editor!=null&&!editor.getText().toString().trim().isEmpty())showInbox();}
   public void onEvent(int event,Bundle params){}
  });Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"es-AR");intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,true);intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
  try{listening=true;recognizer.startListening(intent);status.setText("Preparando el micrófono…");handler.postDelayed(stopTimeout,30000);}catch(Exception e){listening=false;status.setText("No pude iniciar el dictado. Podés escribir la nota.");}
 }
 private void stopListening(boolean finish){handler.removeCallbacks(stopTimeout);if(finish)finishRequested=true;if(recognizer!=null&&listening){try{recognizer.stopListening();}catch(Exception e){listening=false;saveEditor();if(finish)showInbox();}}else{saveEditor();if(finish)showInbox();}}
 private void destroyRecognition(){handler.removeCallbacks(stopTimeout);generation++;listening=false;if(recognizer!=null){try{recognizer.cancel();recognizer.destroy();}catch(Exception ignored){}recognizer=null;}}
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==7){if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED&&onCapture)startListening();else if(status!=null)status.setText("Podés escribir la nota o habilitar el micrófono en Ajustes.");}}
 @Override protected void onPause(){saveEditor();destroyRecognition();super.onPause();}
 @Override protected void onDestroy(){handler.removeCallbacksAndMessages(null);destroyRecognition();super.onDestroy();}
 @Override protected void onSaveInstanceState(Bundle out){out.putBoolean("capture",onCapture);out.putBoolean("registered",showRegistered);if(onCapture){out.putString("noteId",noteId);out.putString("createdAt",createdAt);out.putString("noteDate",noteDate);out.putString("token",receiptToken);out.putString("text",editor==null?"":editor.getText().toString());}super.onSaveInstanceState(out);}
 private void toast(String text){Toast.makeText(this,text,Toast.LENGTH_LONG).show();}
 private void menu(View anchor){PopupMenu menu=new PopupMenu(this,anchor);menu.getMenu().add("Guardar copia de notas");menu.getMenu().add("Cómo funciona");menu.setOnMenuItemClickListener(item->{if("Guardar copia de notas".contentEquals(item.getTitle())){Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,"notas_anotar_gasto.json");startActivityForResult(intent,9);}else new AlertDialog.Builder(this).setTitle("Anotar gasto").setMessage("Dictá o escribí una nota. Queda guardada en este teléfono con fecha y hora. Después elegís la app y confirmás el gasto. Al terminar, tocá Volver a Anotar gasto para que la nota salga de pendientes. El dictado puede necesitar Internet.").setPositiveButton("Listo",null).show();return true;});menu.show();}
 @Override protected void onActivityResult(int request,int result,Intent intent){super.onActivityResult(request,result,intent);if(request==9&&result==RESULT_OK&&intent!=null&&intent.getData()!=null){try(java.io.OutputStream stream=getContentResolver().openOutputStream(intent.getData())){JSONObject backup=new JSONObject();backup.put("app","anotar-gasto-android");backup.put("version",1);backup.put("notes",store.all());stream.write(backup.toString(2).getBytes(java.nio.charset.StandardCharsets.UTF_8));toast("Copia guardada.");}catch(Exception e){toast("No pude guardar la copia. Tus notas siguen en la app.");}}}
 private class MicView extends View {private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);MicView(){super(MainActivity.this);setFocusable(true);}protected void onDraw(Canvas canvas){super.onDraw(canvas);float cx=getWidth()/2f,cy=getHeight()/2f,r=Math.min(cx,cy)-dp(12);paint.setColor(listening?Color.rgb(49,101,83):PANEL);canvas.drawCircle(cx,cy,r+dp(10),paint);paint.setColor(MINT);canvas.drawCircle(cx,cy,r,paint);paint.setColor(BG);canvas.drawRoundRect(new RectF(cx-dp(13),cy-dp(38),cx+dp(13),cy+dp(14)),dp(14),dp(14),paint);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(5));paint.setStrokeCap(Paint.Cap.ROUND);canvas.drawArc(new RectF(cx-dp(24),cy-dp(18),cx+dp(24),cy+dp(28)),0,180,false,paint);canvas.drawLine(cx,cy+dp(29),cx,cy+dp(45),paint);canvas.drawLine(cx-dp(12),cy+dp(45),cx+dp(12),cy+dp(45),paint);paint.setStyle(Paint.Style.FILL);}}
}
