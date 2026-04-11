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

    private Object audioFocusRequest;
    private PluginCall pendingScoCall;
    private android.os.Handler timeoutHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private boolean guardianActive = false;
    private final android.content.BroadcastReceiver speakerphoneReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(Context context, android.content.Intent intent) {
            String action = intent.getAction();
            if (guardianActive && "android.media.action.SPEAKERPHONE_STATE_CHANGED".equals(action)) {
                AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
                if (audioManager.isSpeakerphoneOn()) {
                    audioManager.setSpeakerphoneOn(false);
                }
            }
        }
    };

    private void resolvePendingSco(String status) {
        timeoutHandler.removeCallbacksAndMessages(null);
        if (pendingScoCall != null) {
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("status", status);
            pendingScoCall.resolve(ret);
            pendingScoCall = null;
        }
    }

    private void forceRoutingToEarbudsDirectly() {
        AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.setSpeakerphoneOn(false);
    }

    private AudioManager.OnAudioFocusChangeListener focusChangeListener = focusChange -> {
        if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
            forceRoutingToEarbudsDirectly();
        }
    };

    @PluginMethod
    public void forceEarbuds(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            pendingScoCall = call;
            guardianActive = true;

            // 1. REGISTER RECEIVERS IF NEEDED
            if (!isReceiverRegistered) {
                getContext().registerReceiver(scoReceiver, new android.content.IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED));
                getContext().registerReceiver(speakerphoneReceiver, new android.content.IntentFilter("android.media.action.SPEAKERPHONE_STATE_CHANGED"));
                isReceiverRegistered = true;
            }

            // 2. TIMEOUT GUARD (3.5 Seconds)
            timeoutHandler.postDelayed(() -> {
                if (pendingScoCall != null) {
                    forceRoutingToEarbudsDirectly();
                    resolvePendingSco("timeout_fallback");
                }
            }, 3500);

            // 3. START SCO & REQUEST FOCUS
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

            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            audioManager.setSpeakerphoneOn(false);

        } catch (Exception e) {
            resolvePendingSco("error");
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            guardianActive = false;
            
            if (isReceiverRegistered) {
                getContext().unregisterReceiver(scoReceiver);
                getContext().unregisterReceiver(speakerphoneReceiver);
                isReceiverRegistered = false;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest((android.media.AudioFocusRequest) audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(focusChangeListener);
            }
            
            audioManager.setBluetoothScoOn(false);
            audioManager.stopBluetoothSco();
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(false);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to reset: " + e.getMessage());
        }
    }
}
