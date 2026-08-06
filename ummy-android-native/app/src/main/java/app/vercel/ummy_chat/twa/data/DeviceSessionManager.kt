package app.vercel.ummy_chat.twa.data

import android.content.Context
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.util.UUID

// ============================================================
// React Native lib/device-session.ts → Kotlin (1-to-1 Line Match)
// Source: src/lib/device-session.ts (44 lines)
// ============================================================
object DeviceSessionManager {

    private const val PREFS_NAME = "ummy_device_prefs"
    private const val DEVICE_ID_KEY = "@ummy_device_id"

    private lateinit var appContext: Context

    fun init(context: Context) {
        if (!::appContext.isInitialized) {
            appContext = context.applicationContext
        }
    }

    suspend fun getOrCreateDeviceId(): String {
        val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        var id = prefs.getString(DEVICE_ID_KEY, null)
        if (id == null) {
            id = generateUUID()
            prefs.edit().putString(DEVICE_ID_KEY, id).apply()
        }
        return id
    }

    suspend fun registerDeviceSession(firestore: FirebaseFirestore, uid: String) {
        val deviceId = getOrCreateDeviceId()
        val userRef = firestore.collection("users").document(uid)
        userRef.set(
            hashMapOf(
                "activeDeviceId" to deviceId,
                "lastLoginAt" to FieldValue.serverTimestamp()
            ),
            com.google.firebase.firestore.SetOptions.merge()
        ).await()
    }

    suspend fun isCurrentDeviceActive(firestore: FirebaseFirestore, uid: String): Boolean {
        return try {
            val deviceId = getOrCreateDeviceId()
            val userRef = firestore.collection("users").document(uid)
            val snap = userRef.get().await()
            if (!snap.exists()) return true
            if (!snap.contains("activeDeviceId")) return true
            snap.getString("activeDeviceId") == deviceId
        } catch (e: Exception) {
            true
        }
    }

    private fun generateUUID(): String {
        return UUID.randomUUID().toString()
    }
}
