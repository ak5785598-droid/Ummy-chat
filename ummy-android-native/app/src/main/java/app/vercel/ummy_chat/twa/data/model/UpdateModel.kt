package app.vercel.ummy_chat.twa.data.model

import com.google.firebase.Timestamp

data class UpdateModel(
    val latestVersionCode: Int = 1,
    val latestVersionName: String = "1.0.0",
    val updateUrl: String = "https://play.google.com/store/apps/details?id=app.vercel.ummy_chat.twa",
    val forceUpdate: Boolean = false,
    val releaseNotes: String = "",
    val timestamp: Timestamp? = null
)
