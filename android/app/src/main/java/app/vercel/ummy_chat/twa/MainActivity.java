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
        
        try {
            // Ensure Firebase is initialized before everything else
            FirebaseApp.initializeApp(this);
            
            // Manual registration for Capacitor 7 stability
            registerPlugin(FirebaseAuthenticationPlugin.class);
            
            Log.d("UmmyAuth", "Bridge & Firebase Initialized - STABLE");
        } catch (Exception e) {
            Log.e("UmmyAuth", "Initialization Error: " + e.getMessage());
        }
    }
}
