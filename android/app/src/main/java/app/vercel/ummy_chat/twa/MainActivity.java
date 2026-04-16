package app.vercel.ummy_chat.twa;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("UmmyAuth", "Initializing Firebase in MainActivity");
        FirebaseApp.initializeApp(this);
    }
}
