package app.vercel.ummy_chat.twa;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
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
            WebView webView = bridge.getWebView();
            
            // Enable support for multiple windows so onCreateWindow gets called
            webView.getSettings().setSupportMultipleWindows(true);
            
            // KEY FIX: Subclass Capacitor's own BridgeWebChromeClient instead of a raw WebChromeClient!
            // This prevents wiping out Capacitor's built-in hooks for file inputs, geolocation, console log sync,
            // and most importantly: dynamic native Android RECORD_AUDIO (microphone) permission handling!
            webView.setWebChromeClient(new BridgeWebChromeClient(bridge) {
                @Override
                public void onPermissionRequest(PermissionRequest request) {
                    // Let Capacitor handle standard permission requests natively
                    super.onPermissionRequest(request);
                }

                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    // Create an invisible, temporary WebView to intercept the target URL
                    WebView tempWebView = new WebView(MainActivity.this);
                    tempWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            String url = request.getUrl().toString();
                            handlePopupUrl(url);
                            return true; // Prevent the temp webview from actually loading the url
                        }

                        @SuppressWarnings("deprecation")
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            handlePopupUrl(url);
                            return true; // Prevent the temp webview from actually loading the url
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(tempWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
        }
    }

    private void handlePopupUrl(String url) {
        if (url == null) return;

        // Check if the URL is in our whitelisted safe list or a non-http/https protocol
        if (isAllowedUrl(url)) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private boolean isAllowedUrl(String url) {
        // Allow native system links (e.g. upi://, whatsapp://, intent://)
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return true;
        }

        // Only allow whitelisted safe domains to open in the system browser
        return url.contains("wa.me") || 
               url.contains("whatsapp.com") || 
               url.contains("play.google.com") || 
               url.contains("netmirror.world") || 
               url.contains("larksuite.com") || 
               url.contains("cashfree.com") ||
               url.contains("ummy-chat.vercel.app") ||
               url.contains("localhost");
    }
}
