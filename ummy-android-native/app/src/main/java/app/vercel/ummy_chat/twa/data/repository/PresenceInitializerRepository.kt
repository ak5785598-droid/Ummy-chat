package app.vercel.ummy_chat.twa.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.util.Calendar

class PresenceInitializerRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val database: FirebaseDatabase = FirebaseDatabase.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    suspend fun initializeProfileAndResets(uid: String) {
        try {
            val userRef = firestore.collection("users").document(uid)
            val snap = userRef.get().await()

            if (snap.exists()) {
                val data = snap.data ?: return
                val isBanned = (data["banStatus"] as? Map<*, *>)?.get("isBanned") == true
                if (isBanned) return

                val now = Calendar.getInstance()
                val lastSeenTs = snap.getTimestamp("lastSeen")
                val lastSeenCal = Calendar.getInstance().apply {
                    if (lastSeenTs != null) time = lastSeenTs.toDate()
                }

                val isDifferentDay = now.get(Calendar.DAY_OF_YEAR) != lastSeenCal.get(Calendar.DAY_OF_YEAR) ||
                        now.get(Calendar.YEAR) != lastSeenCal.get(Calendar.YEAR)

                val updates = hashMapOf<String, Any>(
                    "isOnline" to true,
                    "lastSeen" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )

                if (isDifferentDay) {
                    updates["wallet.dailySpent"] = 0
                }

                if (isDifferentDay && now.get(Calendar.DAY_OF_WEEK) == Calendar.MONDAY) {
                    updates["wallet.weeklySpent"] = 0
                }

                if (now.get(Calendar.MONTH) != lastSeenCal.get(Calendar.MONTH) ||
                    now.get(Calendar.YEAR) != lastSeenCal.get(Calendar.YEAR)
                ) {
                    updates["wallet.monthlySpent"] = 0
                }

                userRef.update(updates).await()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun setGlobalOnlineStatus(uid: String, isOnline: Boolean) {
        try {
            val presenceRef = database.getReference("globalPresence/$uid")
            if (isOnline) {
                presenceRef.setValue(
                    mapOf(
                        "uid" to uid,
                        "isOnline" to true,
                        "lastSeen" to ServerValue.TIMESTAMP
                    )
                )
                presenceRef.onDisconnect().setValue(
                    mapOf(
                        "uid" to uid,
                        "isOnline" to false,
                        "lastSeen" to ServerValue.TIMESTAMP
                    )
                )
                firestore.collection("users").document(uid).update("isOnline", true)
            } else {
                presenceRef.setValue(
                    mapOf(
                        "uid" to uid,
                        "isOnline" to false,
                        "lastSeen" to ServerValue.TIMESTAMP
                    )
                )
                firestore.collection("users").document(uid).update("isOnline", false)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
