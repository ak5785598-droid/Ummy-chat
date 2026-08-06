package app.vercel.ummy_chat.twa.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.tasks.await
import kotlin.random.Random

const val CREATOR_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1"

enum class SyncIdentityResult { BANNED, EXISTS, CREATED }

class UserRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    suspend fun isBanned(uid: String): Boolean {
        return try {
            val snap = firestore.collection("users").document(uid).get().await()
            if (!snap.exists()) return false
            val banStatus = snap.get("banStatus") as? Map<*, *> ?: return false
            val isBanned = banStatus["isBanned"] as? Boolean ?: false
            if (!isBanned) return false
            val bannedUntil = banStatus["bannedUntil"]
            // Timestamp from Firestore; null bannedUntil = permanent ban
            val until = bannedUntil as? com.google.firebase.Timestamp
            until == null || until.toDate().after(java.util.Date())
        } catch (e: Exception) {
            false
        }
    }

    suspend fun hasOnboardingComplete(uid: String): Boolean {
        return try {
            val snap = firestore.collection("users").document(uid).get().await()
            snap.exists() &&
                    (snap.getBoolean("onboardingComplete") == true || snap.contains("username"))
        } catch (e: Exception) {
            false
        }
    }

    suspend fun userExists(uid: String): Boolean {
        return try {
            firestore.collection("users").document(uid).get().await().exists()
        } catch (e: Exception) {
            false
        }
    }

    // ============================================================
    // ⚡ USER IDENTITY SYNC (React Native login.tsx L171-214) ⚡
    // ============================================================
    suspend fun syncUserIdentity(uid: String, email: String?, displayName: String?): SyncIdentityResult {
        val userRef = firestore.collection("users").document(uid)
        val profileRef = firestore.collection("users").document(uid).collection("profile").document(uid)
        return try {
            val userSnap = userRef.get().await()
            if (userSnap.exists()) {
                val data = userSnap.data
                val banStatus = data?.get("banStatus") as? Map<*, *>
                if (banStatus?.get("isBanned") == true) {
                    val until = banStatus["bannedUntil"] as? com.google.firebase.Timestamp
                    if (until == null || until.toDate().after(java.util.Date())) {
                        return SyncIdentityResult.BANNED
                    }
                }
                return SyncIdentityResult.EXISTS
            }
            // Create new user (React Native L188-211)
            val accountNumber = generateNumericID(uid)
            val baseData = hashMapOf<String, Any?>(
                "id" to uid,
                "username" to (displayName?.takeIf { it.isNotBlank() } ?: "Tribe_$accountNumber"),
                "accountNumber" to accountNumber,
                "accountNumberLocked" to true,
                "avatarUrl" to "",
                "wallet" to hashMapOf(
                    "coins" to 0,
                    "diamonds" to 0,
                    "totalSpent" to 0,
                    "dailySpent" to 0,
                    "weeklySpent" to 0,
                    "monthlySpent" to 0
                ),
                "level" to hashMapOf("rich" to 1, "charm" to 1),
                "banStatus" to hashMapOf(
                    "isBanned" to false,
                    "bannedUntil" to null,
                    "reason" to ""
                ),
                "isOnline" to true,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            userRef.set(baseData, SetOptions.merge()).await()
            // React Native: { ...baseData, email, bio, inventory, tags, stats }
            val profileData = hashMapOf<String, Any?>()
            profileData.putAll(baseData)
            profileData["email"] = email ?: ""
            profileData["bio"] = "Find your vibe, connect with your tribe."
            profileData["inventory"] = hashMapOf(
                "ownedItems" to arrayListOf<String>(),
                "activeFrame" to "None"
            )
            profileData["tags"] = arrayListOf<String>()
            profileData["stats"] = hashMapOf(
                "followers" to 0,
                "fans" to 0,
                "totalGifts" to 0,
                "dailyFans" to 0,
                "friends" to 0,
                "following" to 0
            )
            profileRef.set(profileData, SetOptions.merge()).await()
            SyncIdentityResult.CREATED
        } catch (e: Exception) {
            SyncIdentityResult.EXISTS
        }
    }

    // ============================================================
    // ⚡ HELPER: Generate 6-digit ID (React Native L99-121) ⚡
    // ============================================================
    suspend fun generateNumericID(uid: String): String {
        if (uid == CREATOR_ID) return "0000"
        return try {
            firestore.runTransaction { tx ->
                for (i in 0 until 10) {
                    val num = String.format("%06d", Random.nextInt(100000, 999999))
                    val idRef = firestore.collection("assigned_ids").document(num)
                    val snap = tx.get(idRef)
                    if (!snap.exists()) {
                        tx.set(idRef, hashMapOf(
                            "uid" to uid,
                            "assignedAt" to FieldValue.serverTimestamp()
                        ))
                        return@runTransaction num
                    }
                }
                val fallback = String.format("%06d", Random.nextInt(100000, 999999))
                val fallbackRef = firestore.collection("assigned_ids").document(fallback)
                tx.set(fallbackRef, hashMapOf(
                    "uid" to uid,
                    "assignedAt" to FieldValue.serverTimestamp()
                ))
                fallback
            }.await()
        } catch (e: Exception) {
            String.format("%06d", Random.nextInt(100000, 999999))
        }
    }
}
