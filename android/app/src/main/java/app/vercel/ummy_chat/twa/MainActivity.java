package app.vercel.ummy_chat.twa;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i("UmmyAuth", "=== MainActivity Start ===");
        try {
            Log.i("UmmyAuth", "Initializing Firebase App...");
            FirebaseApp.initializeApp(this);
            Log.i("UmmyAuth", "Registering FirebaseAuthenticationPlugin...");
            registerPlugin(FirebaseAuthenticationPlugin.class);
            Log.i("UmmyAuth", "Initialization SUCCESS");
        } catch (Exception e) {
            Log.e("UmmyAuth", "Initialization FAILED: " + e.getMessage(), e);
        }
    }
}
