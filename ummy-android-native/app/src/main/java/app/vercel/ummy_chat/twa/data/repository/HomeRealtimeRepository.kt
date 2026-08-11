package app.vercel.ummy_chat.twa.data.repository

import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine

data class LiveRoomModel(
    val id: String = "",
    val title: String = "",
    val category: String = "Chat",
    val coverUrl: String? = null,
    val ownerUid: String = "",
    val ownerName: String = "",
    val isLocked: Boolean = false,
    val password: String = "",
    val moderatorIds: List<String> = emptyList(),
    val participantCount: Int = 0,
    val roomNumber: String = "",
    val isPinned: Boolean = false,
    val announcement: String = ""
)

// React Native hooks/use-user-profile.ts: merged base + sub profile doc
data class UserProfileData(
    val username: String = "",
    val accountNumber: String = "",
    val avatarUrl: String = "",
    val coins: Double = 0.0
)

// React Native index.tsx L115-120: users/{uid}/followedRooms
data class FollowedRoomEntry(
    val roomId: String = "",
    val followedAt: Long = 0L
)

// React Native index.tsx L122-127: users/{uid}/recentVisits
data class RecentVisitEntry(
    val roomId: String = "",
    val visitedAt: Long = 0L,
    val title: String = "",
    val coverUrl: String? = null,
    val roomNumber: String = "",
    val ownerId: String = ""
)

class HomeRealtimeRepository {
    private val firestore = FirebaseFirestore.getInstance()

    private fun getRoomPresenceStream(): Flow<Map<String, Int>> = callbackFlow {
        val ref = FirebaseDatabase.getInstance().getReference("roomPresence")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val countsMap = mutableMapOf<String, Int>()
                val now = System.currentTimeMillis()
                snapshot.children.forEach { roomSnapshot ->
                    val roomId = roomSnapshot.key ?: return@forEach
                    // Skip diagnostic nodes
                    if (roomId.startsWith("_")) return@forEach
                    var onlineCount = 0
                    roomSnapshot.children.forEach { userSnapshot ->
                        val isOnline = userSnapshot.child("isOnline").value as? Boolean == true
                        if (!isOnline) return@forEach
                        // lastSeen can be Long (resolved) or HashMap (server timestamp pending)
                        val lastSeenVal = userSnapshot.child("lastSeen").value
                        val lastSeen = when (lastSeenVal) {
                            is Long -> lastSeenVal
                            is Double -> lastSeenVal.toLong()
                            else -> 0L // unresolved server timestamp or null
                        }
                        // Only count if lastSeen is a valid recent timestamp (not 0)
                        if (lastSeen > 0L && (now - lastSeen) <= 30000) {
                            onlineCount++
                        }
                    }
                    if (onlineCount > 0) {
                        countsMap[roomId] = onlineCount
                    }
                }
                trySend(countsMap)
            }
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        ref.addValueEventListener(listener)
        // Send initial empty map so combine doesn't hang if RTDB takes a moment
        trySend(emptyMap<String, Int>())
        awaitClose { ref.removeEventListener(listener) }
    }

    fun getLiveRoomsStream(): Flow<List<LiveRoomModel>> {
        val firestoreStream = callbackFlow<List<LiveRoomModel>> {
            val listener = firestore.collection("chatRooms")
                .limit(100)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        close(error)
                        return@addSnapshotListener
                    }
                    trySend(snapshot?.documents?.mapNotNull { doc -> docToRoom(doc) } ?: emptyList())
                    Unit
                }
            awaitClose { listener.remove() }
        }

        return firestoreStream.combine(getRoomPresenceStream()) { rooms: List<LiveRoomModel>, presenceMap: Map<String, Int> ->
            rooms.map { room ->
                // Map the LiveRoomModel's participantCount to the RTDB live presence count
                room.copy(participantCount = presenceMap[room.id] ?: 0)
            }
        }
    }

    // React Native index.tsx L129-137: myRoomQuery (chatRooms where ownerId == uid limit 1)
    fun getMyRoomsStream(uid: String): Flow<List<LiveRoomModel>> = callbackFlow {
        val listener = firestore.collection("chatRooms")
            .whereEqualTo("ownerId", uid)
            .limit(1)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                trySend(snapshot?.documents?.mapNotNull { doc -> docToRoom(doc) } ?: emptyList())
            }
        awaitClose { listener.remove() }
    }

    // React Native hooks/use-user-profile.ts L206-234: merge base users/{uid} + sub profile/{uid}
    fun getUserProfileStream(uid: String): Flow<UserProfileData?> = callbackFlow {
        var base: Map<String, Any>? = null
        var sub: Map<String, Any>? = null

        fun tryEmitMerged() {
            val b = base
            val s = sub
            if (b == null && s == null) return
            val baseWallet = b?.get("wallet") as? Map<*, *> ?: emptyMap<Any, Any>()
            val subWallet = s?.get("wallet") as? Map<*, *> ?: emptyMap<Any, Any>()
            val subCoins = subWallet["coins"] ?: s?.get("coins")
            val baseCoins = baseWallet["coins"] ?: b?.get("coins")
            val coins = ((subCoins as? Number) ?: (baseCoins as? Number))?.toDouble() ?: 0.0

            trySend(
                UserProfileData(
                    username = (s?.get("username") as? String)
                        ?: (b?.get("username") as? String)
                        ?: (s?.get("name") as? String)
                        ?: (b?.get("name") as? String)
                        ?: (s?.get("displayName") as? String)
                        ?: (b?.get("displayName") as? String)
                        ?: "",
                    accountNumber = (b?.get("accountNumber") as? String)
                        ?: (s?.get("accountNumber") as? String)
                        ?: "",
                    avatarUrl = (s?.get("avatarUrl") as? String)
                        ?: (b?.get("avatarUrl") as? String)
                        ?: (s?.get("photoURL") as? String)
                        ?: (b?.get("photoURL") as? String)
                        ?: "",
                    coins = coins
                )
            )
        }

        val baseRef = firestore.collection("users").document(uid)
        val subRef = baseRef.collection("profile").document(uid)

        val baseListener = baseRef.addSnapshotListener { snap, _ ->
            base = if (snap != null && snap.exists()) snap.data else null
            tryEmitMerged()
        }
        val subListener = subRef.addSnapshotListener { snap, _ ->
            sub = if (snap != null && snap.exists()) snap.data else null
            tryEmitMerged()
        }

        awaitClose {
            baseListener.remove()
            subListener.remove()
        }
    }

    // React Native index.tsx L115-120: followedRoomsQuery
    fun getFollowedRoomsStream(uid: String): Flow<List<FollowedRoomEntry>> = callbackFlow {
        val listener = firestore.collection("users").document(uid).collection("followedRooms")
            .orderBy("followedAt", Query.Direction.DESCENDING)
            .limit(20)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val entries = snapshot?.documents?.mapNotNull { doc ->
                    FollowedRoomEntry(
                        roomId = doc.id,
                        followedAt = doc.getTimestamp("followedAt")?.toDate()?.time ?: System.currentTimeMillis()
                    )
                } ?: emptyList()
                trySend(entries)
            }
        awaitClose { listener.remove() }
    }

    // React Native index.tsx L122-127: recentVisitsQuery
    fun getRecentVisitsStream(uid: String): Flow<List<RecentVisitEntry>> = callbackFlow {
        val listener = firestore.collection("users").document(uid).collection("recentVisits")
            .orderBy("visitedAt", Query.Direction.DESCENDING)
            .limit(20)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val entries = snapshot?.documents?.mapNotNull { doc ->
                    RecentVisitEntry(
                        roomId = doc.id,
                        visitedAt = doc.getTimestamp("visitedAt")?.toDate()?.time ?: System.currentTimeMillis(),
                        title = doc.getString("title") ?: "Room",
                        coverUrl = doc.getString("coverUrl") ?: doc.getString("roomBanner"),
                        roomNumber = doc.getString("roomNumber") ?: "",
                        ownerId = doc.getString("ownerId") ?: ""
                    )
                } ?: emptyList()
                trySend(entries)
            }
        awaitClose { listener.remove() }
    }

    private fun docToRoom(doc: DocumentSnapshot): LiveRoomModel? {
        val data = doc.data ?: return null
        val password = data["password"] as? String ?: ""
        val rawModIds = data["moderatorIds"]
        val moderatorIds = when (rawModIds) {
            is List<*> -> rawModIds.filterIsInstance<String>()
            else -> emptyList()
        }
        return LiveRoomModel(
            id = doc.id,
            title = data["name"] as? String ?: data["title"] as? String ?: "Frequency",
            category = data["category"] as? String ?: "Chat",
            coverUrl = data["coverUrl"] as? String ?: data["roomBanner"] as? String ?: data["avatarUrl"] as? String,
            ownerUid = data["ownerId"] as? String ?: "",
            ownerName = data["ownerName"] as? String ?: data["hostName"] as? String ?: "Tribe Member",
            isLocked = data["isLocked"] as? Boolean ?: password.isNotEmpty(),
            password = password,
            moderatorIds = moderatorIds,
            participantCount = (data["participantCount"] as? Long)?.toInt() ?: 0,
            roomNumber = data["roomNumber"] as? String ?: data["roomId"] as? String ?: "",
            isPinned = data["isPinned"] as? Boolean ?: false,
            announcement = data["announcement"] as? String ?: ""
        )
    }
}
