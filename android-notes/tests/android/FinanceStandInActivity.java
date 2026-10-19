package com.controlfinanzas.anotargasto.tests;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
public final class FinanceStandInActivity extends Activity {
 private Button save; private boolean clicked;
 @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&!clicked&&save!=null){clicked=true;save.postDelayed(()->save.performClick(),500);}}
 @Override public void onCreate(Bundle state){super.onCreate(state);Button button=new Button(this);button.setText("Guardar gasto de prueba");button.setOnClickListener(view->{Intent receipt=new Intent(Intent.ACTION_VIEW,Uri.parse(getIntent().getStringExtra("receipt")));receipt.setPackage("com.controlfinanzas.anotargasto");receipt.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_NO_ANIMATION);startActivity(receipt);});save=button;setContentView(button);}
}
