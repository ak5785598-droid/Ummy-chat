package app.vercel.ummy_chat.twa;

import android.content.Context;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    private Object audioFocusRequest;
    private PluginCall pendingScoCall;
    private Handler timeoutHandler = new Handler(Looper.getMainLooper());
    private boolean guardianActive = false;
    private boolean isReceiverRegistered = false;

    private final BroadcastReceiver speakerphoneReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (guardianActive && "android.media.action.SPEAKERPHONE_STATE_CHANGED".equals(action)) {
                AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
                if (audioManager.isSpeakerphoneOn()) {
                    audioManager.setSpeakerphoneOn(false);
                }
            }
        }
    };

    private final BroadcastReceiver scoReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int state = intent.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, -1);
            if (state == AudioManager.SCO_AUDIO_STATE_CONNECTED) {
                forceRoutingToEarbudsDirectly();
                resolvePendingSco("connected");
            } else if (state == AudioManager.SCO_AUDIO_STATE_DISCONNECTED) {
                // Keep guardian active but acknowledge disconnect
            }
        }
    };

    private void resolvePendingSco(String status) {
        timeoutHandler.removeCallbacksAndMessages(null);
        if (pendingScoCall != null) {
            JSObject ret = new JSObject();
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

            // 1. REGISTER RECEIVERS
            if (!isReceiverRegistered) {
                getContext().registerReceiver(scoReceiver, new IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED));
                getContext().registerReceiver(speakerphoneReceiver, new IntentFilter("android.media.action.SPEAKERPHONE_STATE_CHANGED"));
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
                AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
                AudioFocusRequest focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
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
                audioManager.abandonAudioFocusRequest((AudioFocusRequest) audioFocusRequest);
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
