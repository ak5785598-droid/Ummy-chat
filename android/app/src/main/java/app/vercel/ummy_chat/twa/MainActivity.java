package app.vercel.ummy_chat.twa;

import android.content.Context;
import android.media.AudioManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AudioRoutePlugin.class);
    }
}

/**
 * UMMY NATIVE AUDIO BRIDGE:
 * This plugin forces Android to ignore the speakerphone when in Communication mode.
 */
@CapacitorPlugin(name = "AudioRoute")
class AudioRoutePlugin extends Plugin {

    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            
            // 1. Enter Communication Mode (required for WebRTC focus)
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // 2. FORCE SPEAKER OFF: This ensures earbuds are prioritized
            audioManager.stopBluetoothSco();
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            audioManager.setSpeakerphoneOn(false);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to force earbuds: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setBluetoothScoOn(false);
            audioManager.stopBluetoothSco();
            audioManager.setSpeakerphoneOn(false);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to reset audio: " + e.getMessage());
        }
    }
}
