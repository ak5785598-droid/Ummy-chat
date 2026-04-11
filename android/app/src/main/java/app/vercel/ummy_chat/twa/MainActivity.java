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

    private Object audioFocusRequest; // For Android 8.0+ focus management

    private AudioManager.OnAudioFocusChangeListener focusChangeListener = focusChange -> {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
        }
    };

    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            
            // 1. ADVANCED AUDIO FOCUS (COMMUNICATION MODE LOCK)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.media.AudioAttributes playbackAttributes = new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
                
                android.media.AudioFocusRequest focusRequest = new android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(playbackAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(focusChangeListener)
                    .build();
                
                audioFocusRequest = focusRequest;
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(focusChangeListener, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN);
            }

            // 2. STABLILIZE COMMUNICATIONS MODE
            audioManager.setMicrophoneMute(false);
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // 3. MODERN DEVICE SELECTION (ANDROID 12+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
                AudioDeviceInfo bestDevice = null;
                
                // PRIORITY: BT SCO -> BT A2DP -> WIRED -> EARPIECE
                for (AudioDeviceInfo device : devices) {
                    if (device.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                        bestDevice = device;
                        break;
                    }
                }
                
                if (bestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                            device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                            device.getType() == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                            device.getType() == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            bestDevice = device;
                            break;
                        }
                    }
                }

                if (bestDevice == null) {
                    for (AudioDeviceInfo device : devices) {
                        if (device.getType() == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) {
                            bestDevice = device;
                            break;
                        }
                    }
                }

                if (bestDevice != null) {
                    audioManager.setCommunicationDevice(bestDevice);
                }
            } else {
                // LEGACY FALLBACK
                audioManager.startBluetoothSco();
                audioManager.setBluetoothScoOn(true);
            }
            
            // ALWAYS FORCE SPEAKER OFF
            audioManager.setSpeakerphoneOn(false);
            
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to lock earbuds: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest((android.media.AudioFocusRequest) audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(focusChangeListener);
            }
            
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
