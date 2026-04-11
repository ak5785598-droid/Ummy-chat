package app.vercel.ummy_chat.twa;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import java.util.List;
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
 * UMMY ADVANCED AUDIO BRIDGE (v2.0):
 * Optimized for Android 12+ (API 31+) using setCommunicationDevice.
 */
@CapacitorPlugin(name = "AudioRoute")
class AudioRoutePlugin extends Plugin {

    private AudioManager.OnAudioFocusChangeListener focusChangeListener = focusChange -> {
        if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            // Re-acquire focus if lost during a room session
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
        }
    };

    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            
            // 1. Request focus to ensure we can control the routing
            audioManager.requestAudioFocus(focusChangeListener, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN);

            // 2. Force state parameters for high-priority routing
            audioManager.setMicrophoneMute(false);
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // 3. USE MODERN API FOR ANDROID 12+ (API 31+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
                AudioDeviceInfo BestDevice = null;
                
                // SEARCH PRIORITY: Bluetooth -> Wired -> Earpiece
                for (AudioDeviceInfo device : devices) {
                    if (device.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || 
                        device.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) {
                        BestDevice = device;
                        break;
                    }
                }
                
                if (BestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADSET || 
                            device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                            device.getType() == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            BestDevice = device;
                            break;
                        }
                    }
                }

                if (BestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) {
                            BestDevice = device;
                            break;
                        }
                    }
                }

                if (BestDevice != null) {
                    audioManager.setCommunicationDevice(BestDevice);
                }
                
                // Explicitly disable speakerphone for communication stability
                audioManager.setSpeakerphoneOn(false);
            } else {
                // LEGACY FALLBACK (Android 11 and below)
                audioManager.stopBluetoothSco();
                audioManager.startBluetoothSco();
                audioManager.setBluetoothScoOn(true);
                audioManager.setSpeakerphoneOn(false);
            }
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to force earbuds: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.abandonAudioFocus(focusChangeListener);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                audioManager.clearCommunicationDevice();
            } else {
                audioManager.setBluetoothScoOn(false);
                audioManager.stopBluetoothSco();
            }
            audioManager.setSpeakerphoneOn(false);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to reset audio: " + e.getMessage());
        }
    }
}
