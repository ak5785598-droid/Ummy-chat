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

    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            
            // 1. Enter Communication Mode (required for WebRTC focus)
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // 2. USE MODERN API FOR ANDROID 12+ (API 31+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
                AudioDeviceInfo BestDevice = null;
                
                // SEARCH PRIORITY: Bluetooth -> Wired -> Earpiece
                for (AudioDeviceInfo device : devices) {
                    if (device.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                        BestDevice = device;
                        break;
                    }
                }
                
                if (BestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADSET || 
                            device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADPHONES) {
                            BestDevice = device;
                            break;
                        }
                    }
                }

                if (BestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                            BestDevice = device;
                            break;
                        }
                    }
                }

                if (BestDevice != null) {
                    audioManager.setCommunicationDevice(BestDevice);
                }
                
                // If we chose a non-speaker device, ensure speakerphone is explicitly false
                if (BestDevice != null && BestDevice.getType() != AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                    audioManager.setSpeakerphoneOn(false);
                } else {
                    audioManager.setSpeakerphoneOn(true);
                }
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
