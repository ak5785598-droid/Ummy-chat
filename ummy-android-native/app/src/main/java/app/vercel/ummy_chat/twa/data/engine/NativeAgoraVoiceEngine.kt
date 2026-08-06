package app.vercel.ummy_chat.twa.data.engine

import android.content.Context
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig

class NativeAgoraVoiceEngine(private val context: Context) {
    private var rtcEngine: RtcEngine? = null
    private var currentRoomId: String? = null
    
    private val AGORA_APP_ID = "cd76c7f91f144d4681e2002dc15db9ff"

    fun initializeEngine(
        onUserJoined: (uid: Int) -> Unit,
        onUserOffline: (uid: Int) -> Unit,
        onVolumeIndication: (speakers: Array<out IRtcEngineEventHandler.AudioVolumeInfo>?) -> Unit
    ) {
        if (rtcEngine != null) return

        try {
            val config = RtcEngineConfig()
            config.mContext = context
            config.mAppId = AGORA_APP_ID
            config.mChannelProfile = Constants.CHANNEL_PROFILE_LIVE_BROADCASTING
            config.mEventHandler = object : IRtcEngineEventHandler() {
                override fun onUserJoined(uid: Int, elapsed: Int) {
                    onUserJoined(uid)
                }

                override fun onUserOffline(uid: Int, reason: Int) {
                    onUserOffline(uid)
                }

                override fun onAudioVolumeIndication(
                    speakers: Array<out AudioVolumeInfo>?,
                    totalVolume: Int
                ) {
                    onVolumeIndication(speakers)
                }
            }
            rtcEngine = RtcEngine.create(config)
            rtcEngine?.enableAudio()
            rtcEngine?.enableAudioVolumeIndication(200, 3, true)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun joinVoiceChannel(roomId: String, userNumericUid: Int, isBroadcaster: Boolean) {
        currentRoomId = roomId
        rtcEngine?.setClientRole(
            if (isBroadcaster) Constants.CLIENT_ROLE_BROADCASTER else Constants.CLIENT_ROLE_AUDIENCE
        )
        rtcEngine?.joinChannel(null, roomId, "", userNumericUid)
    }

    fun setMute(isMuted: Boolean) {
        rtcEngine?.muteLocalAudioStream(isMuted)
    }

    fun leaveChannel() {
        rtcEngine?.leaveChannel()
        currentRoomId = null
    }

    fun release() {
        leaveChannel()
        RtcEngine.destroy()
        rtcEngine = null
    }
}
