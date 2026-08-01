package app.vercel.ummy_chat.twa.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class LiveRoomModel(
    val id: String = "",
    val title: String = "",
    val category: String = "Chat",
    val coverUrl: String? = null,
    val ownerUid: String = "",
    val ownerName: String = "",
    val isLocked: Boolean = false,
    val participantCount: Int = 0,
    val roomNumber: String = "",
    val isPinned: Boolean = false
)

class HomeRealtimeRepository {
    private val firestore = FirebaseFirestore.getInstance()

    fun getLiveRoomsStream(): Flow<List<LiveRoomModel>> = callbackFlow {
        val listener = firestore.collection("chatRooms")
            .limit(100)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val rooms = snapshot?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    LiveRoomModel(
                        id = doc.id,
                        title = data["name"] as? String ?: data["title"] as? String ?: "Voice Room",
                        category = data["category"] as? String ?: "Chat",
                        coverUrl = data["roomBanner"] as? String ?: data["avatarUrl"] as? String,
                        ownerUid = data["ownerId"] as? String ?: "",
                        ownerName = data["ownerName"] as? String ?: "Host",
                        isLocked = data["isLocked"] as? Boolean ?: (data["password"] as? String)?.isNotEmpty() == true,
                        participantCount = (data["participantCount"] as? Long)?.toInt() ?: 1,
                        roomNumber = data["roomNumber"] as? String ?: data["roomId"] as? String ?: "",
                        isPinned = data["isPinned"] as? Boolean ?: false
                    )
                } ?: emptyList()
                trySend(rooms)
            }
        awaitClose { listener.remove() }
    }
}
