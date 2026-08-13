package app.vercel.ummy_chat.twa.data.model

data class UpdateModel(
    val latestVersionCode: Int = 1,
    val latestVersionName: String = "1.0.0",
    val updateUrl: String = "",
    val forceUpdate: Boolean = false,
    val releaseNotes: String = "",
    val timestamp: com.google.firebase.Timestamp? = null
)
