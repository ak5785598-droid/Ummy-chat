package app.vercel.ummy_chat.twa;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.PowerManager;
import java.util.List;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    private PowerManager.WakeLock wakeLock;

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
        
        // Set communication mode to prevent hands-free switch when mic activates
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        
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

    /**
     * Keep screen awake (prevent sleep)
     */
    @PluginMethod
    public void keepAwake(PluginCall call) {
        PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        
        if (powerManager == null) {
            call.reject("PowerManager not available");
            return;
        }
        
        // Release existing wake lock if any
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        // Acquire new wake lock - SCREEN_BRIGHT_WAKE_LOCK keeps screen on
        wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "Ummy:ScreenWakeLock"
        );
        wakeLock.acquire(10 * 60 * 1000L); // 10 minutes timeout as safety
        
        call.resolve();
    }

    /**
     * Allow screen to sleep normally
     */
    @PluginMethod
    public void allowSleep(PluginCall call) {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
        
        call.resolve();
    }
}
