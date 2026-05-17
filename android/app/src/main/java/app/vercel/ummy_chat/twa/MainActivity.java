package app.vercel.ummy_chat.twa;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Explicitly register plugins for stability
        registerPlugin(FirebaseAuthenticationPlugin.class);
        registerPlugin(AudioRoutePlugin.class);
    }

    @Override
    public void onStart() {
        super.onStart();
        Bridge bridge = getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public void onPermissionRequest(PermissionRequest request) {
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) ||
                            PermissionRequest.RESOURCE_DESKTOP_VIDEO_CAPTURE.equals(resource) ||
                            PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            request.grant(resources);
                            return;
                        }
                    }
                    request.deny();
                }
            });
        }
    }
}
