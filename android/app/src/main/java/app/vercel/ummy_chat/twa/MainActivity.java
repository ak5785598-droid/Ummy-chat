package app.vercel.ummy_chat.twa;

import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
    static {
        Log.e("UmmyAuth", ">>> MAIN_ACTIVITY_CLASS_LOADED <<<");
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.e("UmmyAuth", "=== MainActivity OnCreate Starting ===");
        Toast.makeText(this, "NATIVE BRIDGE LOADING...", Toast.LENGTH_SHORT).show();
        
        try {
            Log.e("UmmyAuth", "Force initializing Firebase...");
            FirebaseApp.initializeApp(this);
            
            FirebaseApp app = FirebaseApp.getInstance();
            Log.e("UmmyAuth", "FirebaseApp Instance: " + (app != null ? app.getName() : "NULL"));
            
            Log.e("UmmyAuth", "Registering Plugin...");
            registerPlugin(FirebaseAuthenticationPlugin.class);
            Log.e("UmmyAuth", "Initialization SUCCESS");
            
            Toast.makeText(this, "NATIVE BRIDGE READY ✅", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e("UmmyAuth", "Initialization CRASH: " + e.getMessage(), e);
            Toast.makeText(this, "NATIVE BRIDGE ERROR ❌", Toast.LENGTH_LONG).show();
        }
    }
}
