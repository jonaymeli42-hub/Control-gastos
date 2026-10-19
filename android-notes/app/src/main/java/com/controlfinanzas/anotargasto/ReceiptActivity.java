package com.controlfinanzas.anotargasto;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
/** Validates a receipt without opening the recorder or replacing the finance app. */
public final class ReceiptActivity extends Activity {
 @Override public void onCreate(Bundle state){super.onCreate(state);boolean acknowledged=false;
  try{Uri uri=getIntent()==null?null:getIntent().getData();
   if(uri!=null&&"anotargasto".equals(uri.getScheme())&&"registrado-silencioso".equals(uri.getHost())){
    String target=uri.getQueryParameter("app"),id=uri.getLastPathSegment();
    if(NoteRules.validId(id)&&("gastos".equals(target)||"tarjetas".equals(target)))acknowledged=new NoteStore(this).acknowledge(id,uri.getQueryParameter("token"),target);
   }
  }finally{setResult(acknowledged?RESULT_OK:RESULT_CANCELED);finish();overridePendingTransition(0,0);}
 }
}
