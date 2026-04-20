package app.vercel.ummy_chat.twa;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Explicitly register Firebase Authentication plugin for stability
        registerPlugin(FirebaseAuthenticationPlugin.class);
    }
}
