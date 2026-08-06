package app.vercel.ummy_chat.twa

import android.app.Application
import app.vercel.ummy_chat.twa.data.DeviceSessionManager
import com.google.firebase.FirebaseApp

class UmmyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        DeviceSessionManager.init(this)
    }
}
