package app.vercel.ummy_chat.twa.ui.leaderboard

import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class LeaderboardItem(
    val id: String,
    val label: String,
    val avatarUrl: String?,
    val value: Long,
    val identifier: String? // Room number or Account number
)

data class FrameConfig(
    val isEnabled: Boolean = false,
    val imageUrl: String? = null,
    val videoUrl: String? = null,
    val type: String? = null
)

data class LeaderboardThemeConfig(
    val id: String = "",
    val isActive: Boolean = false,
    val backgroundUrl: String? = null,
    val frameConfigs: Map<String, FrameConfig> = emptyMap()
)

class LeaderboardViewModel : ViewModel() {
    private val firestore = FirebaseFirestore.getInstance()

    private val _activeCategory = MutableStateFlow("rich") // rich, charm, rooms
    val activeCategory: StateFlow<String> = _activeCategory.asStateFlow()

    private val _timeFilter = MutableStateFlow("daily") // daily, weekly, monthly
    val timeFilter: StateFlow<String> = _timeFilter.asStateFlow()

    private val _entries = MutableStateFlow<List<LeaderboardItem>>(emptyList())
    val entries: StateFlow<List<LeaderboardItem>> = _entries.asStateFlow()

    private val _activeTheme = MutableStateFlow<LeaderboardThemeConfig?>(null)
    val activeTheme: StateFlow<LeaderboardThemeConfig?> = _activeTheme.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var leaderboardListener: ListenerRegistration? = null
    private var themeListener: ListenerRegistration? = null

    init {
        loadActiveTheme()
        loadLeaderboard()
    }

    fun setCategory(category: String) {
        if (_activeCategory.value == category) return
        _activeCategory.value = category
        loadLeaderboard()
    }

    fun setTimeFilter(filter: String) {
        if (_timeFilter.value == filter) return
        _timeFilter.value = filter
        loadLeaderboard()
    }

    fun refresh() {
        loadLeaderboard()
    }

    private fun loadActiveTheme() {
        themeListener?.remove()
        themeListener = firestore.collection("leaderboardThemes")
            .whereEqualTo("isActive", true)
            .limit(1)
            .addSnapshotListener { snap, _ ->
                val doc = snap?.documents?.firstOrNull()
                if (doc != null) {
                    val data = doc.data ?: return@addSnapshotListener
                    
                    val framesMap = mutableMapOf<String, FrameConfig>()
                    val framesRaw = data["frameConfigs"] as? Map<String, Any>
                    framesRaw?.forEach { (key, value) ->
                        val frameData = value as? Map<String, Any>
                        if (frameData != null) {
                            framesMap[key] = FrameConfig(
                                isEnabled = frameData["isEnabled"] as? Boolean ?: false,
                                imageUrl = frameData["imageUrl"] as? String,
                                videoUrl = frameData["videoUrl"] as? String,
                                type = frameData["type"] as? String
                            )
                        }
                    }

                    _activeTheme.value = LeaderboardThemeConfig(
                        id = doc.id,
                        isActive = data["isActive"] as? Boolean ?: false,
                        backgroundUrl = data["backgroundUrl"] as? String,
                        frameConfigs = framesMap
                    )
                } else {
                    _activeTheme.value = null
                }
            }
    }

    private fun loadLeaderboard() {
        _isLoading.value = true
        leaderboardListener?.remove()

        val category = _activeCategory.value
        val time = _timeFilter.value

        val collectionName = if (category == "rooms") "chatRooms" else "users"
        
        val fieldSuffix = when (category) {
            "rich" -> "Spent"
            "charm" -> "GiftsReceived"
            "rooms" -> "Gifts"
            else -> "Spent"
        }
        
        val prefix = if (category == "rich") "wallet" else "stats"
        val queryField = "$prefix.$time$fieldSuffix"

        leaderboardListener = firestore.collection(collectionName)
            .whereGreaterThan(queryField, 0)
            .orderBy(queryField, Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                if (snap != null) {
                    val parsed = snap.documents.mapNotNull { doc ->
                        val data = doc.data ?: return@mapNotNull null
                        
                        // Handle generic value extraction
                        val parentMap = data[prefix] as? Map<*, *>
                        val value = (parentMap?.get("$time$fieldSuffix") as? Number)?.toLong() ?: 0L
                        
                        // Filter out hidden ranks or 0 values client-side just in case
                        if (value <= 0L || (data["rankHiding"] as? Boolean == true)) return@mapNotNull null

                        if (category == "rooms") {
                            val title = data["title"] as? String ?: data["name"] as? String ?: "Room"
                            val coverUrl = data["coverUrl"] as? String
                            val roomNumber = data["roomNumber"] as? String
                            LeaderboardItem(doc.id, title, coverUrl, value, roomNumber)
                        } else {
                            val username = data["username"] as? String ?: "User"
                            val avatarUrl = data["avatarUrl"] as? String
                            val accNumber = data["accountNumber"] as? String
                            LeaderboardItem(doc.id, username, avatarUrl, value, accNumber)
                        }
                    }
                    _entries.value = parsed
                }
                _isLoading.value = false
            }
    }

    override fun onCleared() {
        super.onCleared()
        leaderboardListener?.remove()
        themeListener?.remove()
    }
}
