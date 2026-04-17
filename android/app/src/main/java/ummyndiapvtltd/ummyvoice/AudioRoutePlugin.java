package ummyndiapvtltd.ummyvoice;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import java.util.List;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    /**
     * Force audio output to earpiece/headset/bluetooth
     */
    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        
        // Mute speaker
        audioManager.setSpeakerphoneOn(false);
        
        // For Android S+ (API 31+), use communication device
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            List<AudioDeviceInfo> deviceList = audioManager.getAvailableCommunicationDevices();
            for (AudioDeviceInfo device : deviceList) {
                int type = device.getType();
                // Route to: Bluetooth SCO, Bluetooth A2DP, Wired headset, Wired headphones, USB headset
                if (type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                    type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                    type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                    type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                    type == AudioDeviceInfo.TYPE_USB_HEADSET ||
                    type == AudioDeviceInfo.TYPE_BLE_HEADSET) {
                    audioManager.setCommunicationDevice(device);
                    break;
                }
            }
        } else {
            // For older Android, use SCO for bluetooth
            audioManager.setBluetoothScoOn(true);
            audioManager.startBluetoothSco();
        }
        
        call.resolve();
    }

    /**
     * Reset audio to speaker
     */
    @PluginMethod
    public void resetAudio(PluginCall call) {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        
        // Enable speaker
        audioManager.setSpeakerphoneOn(true);
        
        // Stop bluetooth SCO
        audioManager.setBluetoothScoOn(false);
        audioManager.stopBluetoothSco();
        
        // Clear communication device on Android S+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice();
        }
        
        call.resolve();
    }

    /**
     * Get current audio route
     */
    @PluginMethod
    public void getCurrentAudioRoute(PluginCall call) {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        
        String route = "unknown";
        
        if (audioManager.isSpeakerphoneOn()) {
            route = "speaker";
        } else if (audioManager.isBluetoothScoOn() || audioManager.isBluetoothA2dpOn()) {
            route = "bluetooth";
        } else {
            route = "earpiece";
        }
        
        call.resolve(new JSObject().put("route", route));
    }

    /**
     * Toggle between speaker and earpiece/headset
     */
    @PluginMethod
    public void toggleAudioOutput(PluginCall call) {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        
        boolean isSpeakerOn = audioManager.isSpeakerphoneOn();
        
        if (isSpeakerOn) {
            // Switch to earpiece/headset
            audioManager.setSpeakerphoneOn(false);
            audioManager.setBluetoothScoOn(true);
            audioManager.startBluetoothSco();
        } else {
            // Switch to speaker
            audioManager.setSpeakerphoneOn(true);
            audioManager.setBluetoothScoOn(false);
            audioManager.stopBluetoothSco();
        }
        
        call.resolve(new JSObject().put("route", isSpeakerOn ? "earpiece" : "speaker"));
    }
}
