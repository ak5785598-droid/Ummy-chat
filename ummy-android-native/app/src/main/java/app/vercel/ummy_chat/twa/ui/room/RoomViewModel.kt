package app.vercel.ummy_chat.twa.ui.room

import android.content.Context
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.vercel.ummy_chat.twa.data.engine.NativeAgoraVoiceEngine
import app.vercel.ummy_chat.twa.data.model.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.*
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class RoomViewModel(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val rtdb: FirebaseDatabase = FirebaseDatabase.getInstance()
) : ViewModel() {

    private var agoraEngine: NativeAgoraVoiceEngine? = null
    private val processedIds = mutableSetOf<String>()
    private val shownEntranceSenders = mutableSetOf<String>()
    private val sessionJoinTime = System.currentTimeMillis()
    private var seatTimeJob: Job? = null
    private var ghostPurgeJob: Job? = null
    private var heartbeatJob: Job? = null
    private var roomPresenceRef: com.google.firebase.database.DatabaseReference? = null
    private var roomDetailsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var participantsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var messagesListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var topSupportersListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var followListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var rtdbGiftsRef: com.google.firebase.database.DatabaseReference? = null
    private var rtdbGiftsListener: ValueEventListener? = null
    private var rtdbLootRef: com.google.firebase.database.DatabaseReference? = null
    private var rtdbLootListener: ValueEventListener? = null

    // ── Core Room State ──────────────────────────────────────────────────────
    private val _room = MutableStateFlow<RoomModel?>(null)
    val room: StateFlow<RoomModel?> = _room.asStateFlow()

    private var currentParticipantsList: List<SeatModel> = emptyList()
    private val _seats = MutableStateFlow<List<SeatModel>>((1..11).map { SeatModel(index = it) })
    val seats: StateFlow<List<SeatModel>> = _seats.asStateFlow()

    private val _messages = MutableStateFlow<List<MessageModel>>(emptyList())
    val messages: StateFlow<List<MessageModel>> = _messages.asStateFlow()

    // ── Current User State ───────────────────────────────────────────────────
    private val _isMicMuted = MutableStateFlow(true)
    val isMicMuted: StateFlow<Boolean> = _isMicMuted.asStateFlow()

    private val _isSpeakerMuted = MutableStateFlow(false)
    val isSpeakerMuted: StateFlow<Boolean> = _isSpeakerMuted.asStateFlow()

    fun toggleSpeakerMute() {
        _isSpeakerMuted.value = !_isSpeakerMuted.value
        agoraEngine?.setSpeakerMuted(_isSpeakerMuted.value)
    }

    private val _isMinimized = MutableStateFlow(false)
    val isMinimized: StateFlow<Boolean> = _isMinimized.asStateFlow()

    fun setMinimized(minimized: Boolean) {
        _isMinimized.value = minimized
    }

    private val _isInSeat = MutableStateFlow(false)
    val isInSeat: StateFlow<Boolean> = _isInSeat.asStateFlow()

    private val _isOwner = MutableStateFlow(false)
    val isOwner: StateFlow<Boolean> = _isOwner.asStateFlow()

    private val _isModerator = MutableStateFlow(false)
    val isModerator: StateFlow<Boolean> = _isModerator.asStateFlow()

    val canManageRoom: StateFlow<Boolean> = combine(_isOwner, _isModerator) { owner, mod ->
        owner || mod
    }.stateIn(viewModelScope, SharingStarted.Eagerly, false)

    // ── Tasks State ──────────────────────────────────────────────────────────
    private val _taskProgress = MutableStateFlow<Map<String, Int>>(emptyMap())
    val taskProgress: StateFlow<Map<String, Int>> = _taskProgress.asStateFlow()

    private val _achievedTasks = MutableStateFlow<List<String>>(emptyList())
    val achievedTasks: StateFlow<List<String>> = _achievedTasks.asStateFlow()

    private val _claimedTasks = MutableStateFlow<List<String>>(emptyList())
    val claimedTasks: StateFlow<List<String>> = _claimedTasks.asStateFlow()

    private var tasksListenerRegistration: com.google.firebase.firestore.ListenerRegistration? = null
    
    // ── Loot System State ────────────────────────────────────────────────────
    private val _lootLevels = MutableStateFlow<List<LootLevel>>(emptyList())
    val lootLevels: StateFlow<List<LootLevel>> = _lootLevels.asStateFlow()

    private val _currentLootLevelIndex = MutableStateFlow(0)
    val currentLootLevelIndex: StateFlow<Int> = _currentLootLevelIndex.asStateFlow()

    private val _isLootGateOpen = MutableStateFlow(false)
    val isLootGateOpen: StateFlow<Boolean> = _isLootGateOpen.asStateFlow()

    private val _completedGateLevels = MutableStateFlow<Map<Int, Boolean>>(emptyMap())
    val completedGateLevels: StateFlow<Map<Int, Boolean>> = _completedGateLevels.asStateFlow()

    private val _lootGateEntries = MutableStateFlow<List<String>>(emptyList())
    val lootGateEntries: StateFlow<List<String>> = _lootGateEntries.asStateFlow()

    private val _hasEnteredLoot = MutableStateFlow(false)
    val hasEnteredLoot: StateFlow<Boolean> = _hasEnteredLoot.asStateFlow()

    private val _lootTimeRemaining = MutableStateFlow(60)
    val lootTimeRemaining: StateFlow<Int> = _lootTimeRemaining.asStateFlow()

    private val _isLootingActive = MutableStateFlow(false)
    val isLootingActive: StateFlow<Boolean> = _isLootingActive.asStateFlow()
    
    private var lootSettingsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var lootTimerJob: Job? = null

    fun setLootGateOpen(open: Boolean) {
        _isLootGateOpen.value = open
        if (open) {
            _lootTimeRemaining.value = 60
            _lootGateEntries.value = emptyList()
            _hasEnteredLoot.value = false
            startLootTimer()
        }
    }

    fun enterLootGate() {
        val uid = auth.currentUser?.uid ?: return
        if (!_hasEnteredLoot.value && _lootGateEntries.value.size < 20) {
            _hasEnteredLoot.value = true
            _lootGateEntries.value = _lootGateEntries.value + uid
        }
    }

    private fun startLootTimer() {
        lootTimerJob?.cancel()
        lootTimerJob = viewModelScope.launch {
            while (_lootTimeRemaining.value > 0) {
                delay(1000)
                _lootTimeRemaining.value -= 1
            }
            // When timer reaches 0
            _isLootGateOpen.value = false
            if (_hasEnteredLoot.value) {
                _isLootingActive.value = true
                // Looting phase lasts for 15 seconds
                delay(15000)
                _isLootingActive.value = false
                _hasEnteredLoot.value = false
            }
            
            // Mark current level as completed
            val currentMap = _completedGateLevels.value.toMutableMap()
            currentMap[_currentLootLevelIndex.value] = true
            _completedGateLevels.value = currentMap
            
            // Advance level if there are more
            if (_currentLootLevelIndex.value < _lootLevels.value.size - 1) {
                _currentLootLevelIndex.value += 1
            }
        }
    }

    fun closeLootingRoom() {
        _isLootingActive.value = false
        _hasEnteredLoot.value = false
    }

    // ── UI Counts ────────────────────────────────────────────────────────────
    private val _onlineCount = MutableStateFlow(0)
    val onlineCount: StateFlow<Int> = _onlineCount.asStateFlow()

    private val _isFollowing = MutableStateFlow(false)
    val isFollowing: StateFlow<Boolean> = _isFollowing.asStateFlow()

    // ── Participants for UserList ─────────────────────────────────────────────
    private val _allParticipants = MutableStateFlow<List<RoomParticipant>>(emptyList())
    val allParticipants: StateFlow<List<RoomParticipant>> = _allParticipants.asStateFlow()

    // ── TopSupporters ────────────────────────────────────────────────────────
    private val _topSupporters = MutableStateFlow<List<TopSupporter>>(emptyList())
    val topSupporters: StateFlow<List<TopSupporter>> = _topSupporters.asStateFlow()

    // ── Broadcast Patties ────────────────────────────────────────────────────
    private val _activeGiftBroadcast = MutableStateFlow<BroadcastEvent?>(null)
    val activeGiftBroadcast: StateFlow<BroadcastEvent?> = _activeGiftBroadcast.asStateFlow()

    private val _activeLootBroadcast = MutableStateFlow<BroadcastEvent?>(null)
    val activeLootBroadcast: StateFlow<BroadcastEvent?> = _activeLootBroadcast.asStateFlow()

    // ── Gift Animations ──────────────────────────────────────────────────────
    private val _giftAnimEvents = MutableStateFlow<List<GiftEvent>>(emptyList())
    val giftAnimEvents: StateFlow<List<GiftEvent>> = _giftAnimEvents.asStateFlow()

    // ── Entry Effect ─────────────────────────────────────────────────────────
    private val _entryEffect = MutableStateFlow<EntryEffect?>(null)
    val entryEffect: StateFlow<EntryEffect?> = _entryEffect.asStateFlow()

    // ── Speaking Intensity Map (uid → intensity) ──────────────────────────────
    private val _speakingMap = MutableStateFlow<Map<Int, Int>>(emptyMap())

    // ── Room ID (current) ────────────────────────────────────────────────────
    private var currentRoomId: String = ""

    // ── Custom Emojis ────────────────────────────────────────────────────────
    private val _customEmojis = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val customEmojis: StateFlow<List<Map<String, Any>>> = _customEmojis.asStateFlow()

    // ── Current User Profile ─────────────────────────────────────────────────
    private val _currentUserSvipLevel = MutableStateFlow(0)
    val currentUserSvipLevel: StateFlow<Int> = _currentUserSvipLevel.asStateFlow()

    private fun fetchCurrentUserProfile() {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            try {
                val profileSnap = firestore.collection("users").document(uid)
                    .collection("profile").document(uid).get().await()
                
                val svipLevel = (profileSnap.get("svip") as? Number)?.toInt() ?: 0
                val officialTitle = profileSnap.getString("officialTitle")
                val isOfficial = (officialTitle == "Official" || officialTitle == "Host")
                _currentUserSvipLevel.value = if (isOfficial) 17 else svipLevel
            } catch (e: Exception) {
                _currentUserSvipLevel.value = 0
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    fun initializeRoom(context: Context, roomId: String, lifecycleOwner: LifecycleOwner? = null) {
        _isMinimized.value = false
        currentRoomId = roomId
        listenToRoomDetails(roomId)
        listenToParticipants(roomId)
        listenToMessages(roomId)
        listenToTopSupporters(roomId)
        listenToGlobalBroadcasts()
        listenToRtdbGifts(roomId)
        listenToRtdbLoot(roomId)
        listenToCustomEmojis()
        checkFollowStatus(roomId)
        initializeAgora(context, roomId)
        recordVisit(roomId)
        updateUserPresence(roomId)
        startGhostPurge(roomId)
        fetchCurrentUserProfile()

        // Register lifecycle observer for background/foreground room presence sync
        lifecycleOwner?.lifecycle?.addObserver(object : DefaultLifecycleObserver {
            override fun onStop(owner: LifecycleOwner) {
                // App backgrounded — mark room presence as background
                val uid = auth.currentUser?.uid ?: return
                roomPresenceRef?.updateChildren(
                    mapOf(
                        "isOnline" to true,
                        "isBackground" to true,
                        "lastSeen" to ServerValue.TIMESTAMP
                    )
                )
            }

            override fun onStart(owner: LifecycleOwner) {
                // App foregrounded — re-establish room presence + onDisconnect
                val uid = auth.currentUser?.uid ?: return
                val ref = roomPresenceRef ?: return
                ref.updateChildren(
                    mapOf(
                        "isOnline" to true,
                        "isBackground" to false,
                        "lastSeen" to ServerValue.TIMESTAMP
                    )
                )
                ref.onDisconnect().removeValue()
            }
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIRESTORE LISTENERS
    // ─────────────────────────────────────────────────────────────────────────
    private fun listenToRoomDetails(roomId: String) {
        roomDetailsListener?.remove()
        roomDetailsListener = firestore.collection("chatRooms").document(roomId)
            .addSnapshotListener { snap, _ ->
                if (snap == null || !snap.exists()) return@addSnapshotListener
                val uid = auth.currentUser?.uid ?: ""
                val ownerId = snap.getString("ownerId") ?: ""
                val modIds = (snap.get("moderatorIds") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                _isOwner.value = uid == ownerId
                _isModerator.value = modIds.contains(uid)

                _room.value = RoomModel(
                    id = roomId,
                    title = snap.getString("name") ?: snap.getString("title") ?: "Ummy Room",
                    ownerId = ownerId,
                    ownerName = snap.getString("ownerName") ?: "",
                    announcement = snap.getString("announcement") ?: "",
                    category = snap.getString("category") ?: "Chat",
                    seatsCount = (snap.getLong("maxActiveMics") ?: snap.getLong("seatsCount") ?: 9L).toInt(),
                    roomNumber = snap.getString("roomNumber") ?: snap.getString("roomId") ?: "",
                    coverUrl = snap.getString("coverUrl") ?: snap.getString("roomBanner"),
                    backgroundUrl = snap.getString("backgroundUrl"),
                    moderatorIds = modIds,
                    lockedSeats = (snap.get("lockedSeats") as? List<*>)?.filterIsInstance<Long>()?.map { it.toInt() } ?: emptyList(),
                    mutedSeats = (snap.get("mutedSeats") as? List<*>)?.filterIsInstance<Long>()?.map { it.toInt() } ?: emptyList(),
                    bannedUsers = (snap.get("bannedUsers") as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                    password = snap.getString("password"),
                    isAIVoiceEnabled = snap.getBoolean("isAIVoiceEnabled") ?: false,
                    levelPoints = snap.getLong("levelPoints") ?: 0L,
                    dailyGifts = (snap.get("stats") as? Map<*, *>)?.get("dailyGifts") as? Long ?: 0L,
                    totalGifts = ((snap.get("stats") as? Map<*, *>)?.get("totalGifts") as? Number)?.toLong()
                        ?: ((snap.get("stats") as? Map<*, *>)?.get("dailyGifts") as? Number)?.toLong() ?: 0L,
                    currentMusicUrl = snap.getString("currentMusicUrl"),
                    currentMusicTitle = snap.getString("currentMusicTitle"),
                    chatClearedAt = snap.getTimestamp("chatClearedAt")
                )
                updateSeats()
                listenToRoomTasks()
                listenToLootSettings()
                
                // Update loot progress whenever dailyGifts changes
                val currentDailyGifts = snap.getLong("levelPoints") ?: 0L // Assuming dailyGifts or levelPoints
                updateLootProgress(snap.getLong("stats.dailyGifts") ?: currentDailyGifts)
            }
    }

    private fun listenToCustomEmojis() {
        firestore.collection("customEmojis")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snap, err ->
                if (err != null || snap == null) return@addSnapshotListener
                val list = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    data["id"] = doc.id
                    data
                }
                _customEmojis.value = list
            }
    }

    private fun listenToParticipants(roomId: String) {
        participantsListener?.remove()
        participantsListener = firestore.collection("chatRooms").document(roomId)
            .collection("participants")
            .addSnapshotListener { snap, _ ->
                val uid = auth.currentUser?.uid ?: ""
                val docs = snap?.documents ?: return@addSnapshotListener
                val room = _room.value
                val lockedSeats = room?.lockedSeats ?: emptyList()
                val participants = docs.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val seatIdx = (data["seatIndex"] as? Long)?.toInt() ?: 0
                    if (seatIdx == 0) return@mapNotNull null
                    SeatModel(
                        index = seatIdx,
                        userId = doc.id,
                        username = data["name"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String,
                        isMuted = data["isMuted"] as? Boolean ?: true,
                        isLocked = lockedSeats.contains(seatIdx),
                        isSpeaking = (_speakingMap.value[doc.id.hashCode() and 0x7FFFFFFF] ?: 0) > 15,
                        activeEmoji = data["activeEmoji"] as? String,
                        activeWave = data["activeWave"] as? String,
                        avatarFrameUrl = data["activeFrameMediaUrl"] as? String,
                        relationship = data["relationship"] as? String,
                        bestFriend = data["bestFriend"] as? String,
                        kickedUntil = (data["kickedUntil"] as? Long)
                    )
                }

                currentParticipantsList = participants
                _onlineCount.value = docs.size
                updateSeats()

                // All participants for UserList (including audience — seatIndex == 0)
                _allParticipants.value = docs.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    RoomParticipant(
                        uid = doc.id,
                        name = data["name"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String,
                        seatIndex = (data["seatIndex"] as? Long)?.toInt() ?: 0,
                        isMuted = data["isMuted"] as? Boolean ?: true,
                        isInSeat = (data["seatIndex"] as? Long ?: 0L) > 0L,
                        isRequestingMic = data["isRequestingMic"] as? Boolean ?: false,
                        requestedSeatIndex = (data["requestedSeatIndex"] as? Long)?.toInt() ?: 1
                    )
                }

                val myPart = participants.find { it.userId == uid }
                _isInSeat.value = (myPart?.index ?: 0) > 0
                if (myPart != null) {
                    _isMicMuted.value = myPart.isMuted
                }
            }
    }

    private fun updateSeats() {
        val room = _room.value ?: return
        val locked = room.lockedSeats
        val muted = room.mutedSeats
        
        _seats.value = (1..room.seatsCount).map { index ->
            val p = currentParticipantsList.find { it.index == index }
            if (p != null) {
                p.copy(
                    isLocked = locked.contains(index),
                    isMuted = p.isMuted || muted.contains(index)
                )
            } else {
                SeatModel(
                    index = index,
                    isLocked = locked.contains(index),
                    isMuted = muted.contains(index)
                )
            }
        }
    }

    private fun listenToMessages(roomId: String) {
        messagesListener?.remove()
        val queryFrom = com.google.firebase.Timestamp(java.util.Date(sessionJoinTime - 3000))
        
        // Fetch chatClearedAt directly from Firestore (don't depend on _room.value race)
        firestore.collection("chatRooms").document(roomId).get()
            .addOnSuccessListener { roomDoc ->
                val clearedAt = roomDoc.getTimestamp("chatClearedAt")
                startMessagesListener(roomId, queryFrom, clearedAt)
            }
            .addOnFailureListener {
                startMessagesListener(roomId, queryFrom, null)
            }
    }

    private fun startMessagesListener(roomId: String, queryFrom: com.google.firebase.Timestamp, clearedAt: com.google.firebase.Timestamp?) {
        messagesListener = firestore.collection("chatRooms").document(roomId)
            .collection("messages")
            .whereGreaterThan("timestamp", queryFrom)
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .limit(100)
            .addSnapshotListener { snap, _ ->
                val msgs = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val ts = data["timestamp"] as? com.google.firebase.Timestamp ?: com.google.firebase.Timestamp.now()
                    
                    if (clearedAt != null && ts < clearedAt) return@mapNotNull null

                    val msg = MessageModel(
                        id = doc.id,
                        content = data["content"] as? String ?: "",
                        text = data["text"] as? String,
                        senderId = data["senderId"] as? String ?: "",
                        senderName = data["senderName"] as? String ?: "User",
                        senderAvatar = data["senderAvatar"] as? String,
                        senderChatColor = data["senderChatColor"] as? String,
                        senderBubble = data["senderBubble"] as? String,
                        senderBubbleMediaUrl = data["senderBubbleMediaUrl"] as? String,
                        type = data["type"] as? String ?: "text",
                        giftName = data["giftName"] as? String,
                        giftIcon = data["giftIcon"] as? String,
                        effectUrl = data["effectUrl"] as? String,
                        mediaUrl = data["mediaUrl"] as? String,
                        imageUrl = data["imageUrl"] as? String,
                        entryEffectType = data["entryEffectType"] as? String,
                        entryVideoUrl = data["entryVideoUrl"] as? String,
                        isSfx = data["isSfx"] as? Boolean ?: false,
                        isBattle = data["isBattle"] as? Boolean ?: false,
                        comboCount = (data["comboCount"] as? Long)?.toInt() ?: 1,
                        timestamp = ts,
                        senderSvipLevel = (data["senderSvipLevel"] as? Number)?.toInt() ?: 0
                    )
                    // Entry effect trigger
                    if (msg.type == "entrance" && !processedIds.contains(msg.id)) {
                        processedIds.add(msg.id)
                        triggerEntryEffect(msg)
                    }
                    msg
                } ?: emptyList()
                _messages.value = msgs
            }
    }

    private fun listenToTopSupporters(roomId: String) {
        android.util.Log.d("TopSupporter", "Listening to chatRooms/$roomId/topSupporters")
        topSupportersListener?.remove()
        topSupportersListener = firestore.collection("chatRooms").document(roomId)
            .collection("topSupporters")
            .orderBy("dailyAmount", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    android.util.Log.e("TopSupporter", "Firestore error: ${err.message}")
                    _topSupporters.value = emptyList()
                    return@addSnapshotListener
                }
                val docs = snap?.documents ?: emptyList()
                android.util.Log.d("TopSupporter", "Got ${docs.size} docs")
                docs.forEach { doc ->
                    android.util.Log.d("TopSupporter", "  doc=${doc.id} data=${doc.data}")
                }
                _topSupporters.value = docs.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    TopSupporter(
                        uid = doc.id,
                        name = data["name"] as? String ?: data["username"] as? String ?: "",
                        avatarUrl = data["avatarUrl"] as? String,
                        amount = (data["amount"] as? Number)?.toLong() ?: 0L,
                        dailyAmount = (data["dailyAmount"] as? Number)?.toLong() ?: 0L,
                        weeklyAmount = (data["weeklyAmount"] as? Number)?.toLong() ?: 0L,
                        totalAmount = (data["totalAmount"] as? Number)?.toLong() ?: 0L,
                        updatedAt = data["updatedAt"] as? com.google.firebase.Timestamp
                    )
                } ?: emptyList()
            }
    }

    private fun listenToGlobalBroadcasts() {
        firestore.collection("globalBroadcasts")
            .whereGreaterThan("expiresAt", com.google.firebase.Timestamp.now())
            .orderBy("expiresAt", Query.Direction.DESCENDING)
            .limit(10)
            .addSnapshotListener { snap, _ ->
                snap?.documents?.forEach { doc ->
                    val event = BroadcastEvent(
                        id = doc.id,
                        type = doc.getString("type") ?: "gift",
                        roomId = doc.getString("roomId") ?: "",
                        roomNumber = doc.getString("roomNumber") ?: "",
                        senderName = doc.getString("senderName") ?: "",
                        giftName = doc.getString("giftName") ?: "",
                        giftImageUrl = doc.getString("giftImageUrl"),
                        qty = (doc.getLong("qty") ?: 1L).toInt(),
                        levelName = doc.getString("levelName"),
                        gateIndex = (doc.getLong("gateIndex") ?: 0L).toInt()
                    )
                    if (processedIds.contains(event.id)) return@forEach
                    processedIds.add(event.id)
                    if (event.type == "loot" || event.type == "gate_cracked") {
                        showLootBroadcast(event)
                    } else {
                        showGiftBroadcast(event)
                    }
                }
            }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REALTIME DATABASE
    // ─────────────────────────────────────────────────────────────────────────
    private fun listenToRtdbGifts(roomId: String) {
        rtdbGiftsListener?.let { rtdbGiftsRef?.removeEventListener(it) }
        val ref = rtdb.getReference("roomGifts/$roomId/lastGift")
        val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val data = snapshot.value as? Map<*, *> ?: return
                    val id = data["id"] as? String ?: return
                    val ts = data["timestamp"] as? Long ?: 0L
                    if (processedIds.contains(id) || ts < sessionJoinTime) return
                    processedIds.add(id)
                    val evt = GiftEvent(
                        id = id,
                        senderName = data["senderName"] as? String ?: "",
                        giftName = data["giftName"] as? String ?: "",
                        giftIcon = data["giftIcon"] as? String,
                        effectUrl = data["effectUrl"] as? String,
                        comboCount = (data["comboCount"] as? Long)?.toInt() ?: 1,
                        isBattle = data["isBattle"] as? Boolean ?: false,
                        timestamp = ts
                    )
                    _giftAnimEvents.value = (_giftAnimEvents.value + evt).takeLast(5)
                }
                override fun onCancelled(error: DatabaseError) {}
            }
        rtdbGiftsRef = ref
        rtdbGiftsListener = listener
        ref.addValueEventListener(listener)
    }

    private fun listenToRtdbLoot(roomId: String) {
        rtdbLootListener?.let { rtdbLootRef?.removeEventListener(it) }
        val ref = rtdb.getReference("roomLoot/$roomId/lastLoot")
        val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val data = snapshot.value as? Map<*, *> ?: return
                    val id = data["id"] as? String ?: return
                    val ts = data["timestamp"] as? Long ?: 0L
                    if (processedIds.contains(id) || ts < sessionJoinTime) return
                    processedIds.add(id)
                    val evt = BroadcastEvent(
                        id = id, type = "loot",
                        senderName = data["senderName"] as? String ?: "",
                        levelName = data["levelName"] as? String ?: "Home",
                        roomNumber = currentRoomId
                    )
                    showLootBroadcast(evt)
                }
                override fun onCancelled(error: DatabaseError) {}
            }
        rtdbLootRef = ref
        rtdbLootListener = listener
        ref.addValueEventListener(listener)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BROADCAST QUEUE (sequential, mutex-protected)
    // ─────────────────────────────────────────────────────────────────────────
    private val giftQueue = ArrayDeque<BroadcastEvent>()
    private val lootQueue = ArrayDeque<BroadcastEvent>()
    private var giftAnimating = false
    private var lootAnimating = false

    private fun showGiftBroadcast(event: BroadcastEvent) {
        giftQueue.addLast(event)
        if (!giftAnimating) processGiftQueue()
    }

    private fun processGiftQueue() {
        if (giftQueue.isEmpty()) { giftAnimating = false; return }
        giftAnimating = true
        val next = giftQueue.removeFirst()
        viewModelScope.launch {
            _activeGiftBroadcast.value = next
            delay(5500)
            _activeGiftBroadcast.value = null
            delay(300)
            processGiftQueue()
        }
    }

    private fun showLootBroadcast(event: BroadcastEvent) {
        lootQueue.addLast(event)
        if (!lootAnimating) processLootQueue()
    }

    private fun processLootQueue() {
        if (lootQueue.isEmpty()) { lootAnimating = false; return }
        lootAnimating = true
        val next = lootQueue.removeFirst()
        viewModelScope.launch {
            _activeLootBroadcast.value = next
            delay(5500)
            _activeLootBroadcast.value = null
            delay(300)
            processLootQueue()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENTRY EFFECT
    // ─────────────────────────────────────────────────────────────────────────
    private fun triggerEntryEffect(msg: MessageModel) {
        val effectType = msg.entryEffectType ?: return
        if (!shownEntranceSenders.add(msg.senderId)) return
        _entryEffect.value = EntryEffect(
            username = msg.senderName,
            avatarUrl = msg.senderAvatar,
            effectType = effectType,
            mediaUrl = msg.mediaUrl,
            videoUrl = msg.entryVideoUrl
        )
    }

    fun clearEntryEffect() {
        _entryEffect.value = null
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FOLLOW / UNFOLLOW ROOM
    // ─────────────────────────────────────────────────────────────────────────
    private fun checkFollowStatus(roomId: String) {
        val uid = auth.currentUser?.uid ?: return
        followListener?.remove()
        followListener = firestore.collection("users").document(uid).collection("followedRooms").document(roomId)
            .addSnapshotListener { snap, _ -> _isFollowing.value = snap?.exists() == true }
    }

    fun handleFollow() {
        val uid = auth.currentUser?.uid ?: return
        val room = _room.value ?: return
        viewModelScope.launch {
            val ref = firestore.collection("users").document(uid).collection("followedRooms").document(room.id)
            val roomRef = firestore.collection("chatRooms").document(room.id).collection("followers").document(uid)
            if (_isFollowing.value) {
                ref.delete(); roomRef.delete()
            } else {
                val followObj = hashMapOf(
                    "id" to room.id,
                    "title" to room.title,
                    "coverUrl" to (room.coverUrl ?: ""),
                    "roomNumber" to room.roomNumber,
                    "ownerId" to room.ownerId,
                    "followedAt" to FieldValue.serverTimestamp()
                )
                ref.set(followObj, com.google.firebase.firestore.SetOptions.merge())
                roomRef.set(hashMapOf(
                    "uid" to uid,
                    "followedAt" to FieldValue.serverTimestamp()
                ), com.google.firebase.firestore.SetOptions.merge())
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEAT MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    fun takeSeat(seatIdx: Int) {
        val uid = auth.currentUser?.uid ?: return
        val room = _room.value ?: return
        if (room.bannedUsers.contains(uid)) return

        viewModelScope.launch {
            try {
                val userSnap = firestore.collection("users").document(uid).get().await()
                val profileSnap = firestore.collection("users").document(uid).collection("profile").document(uid).get().await()
                val inventory = profileSnap.get("inventory") as? Map<*, *>
                val isSeatMuted = room.mutedSeats.contains(seatIdx)

                val updates = hashMapOf<String, Any?>(
                    "seatIndex" to seatIdx,
                    "isMuted" to isSeatMuted,
                    "name" to (userSnap.getString("username") ?: userSnap.getString("displayName") ?: "User"),
                    "avatarUrl" to (userSnap.getString("avatarUrl") ?: userSnap.getString("photoURL") ?: ""),
                    "activeFrameMediaUrl" to (inventory?.get("activeFrameMediaUrl") as? String),
                    "activeWave" to (inventory?.get("activeWave") as? String),
                    "lastSeen" to FieldValue.serverTimestamp()
                )
                _isMicMuted.value = isSeatMuted
                agoraEngine?.setMute(isSeatMuted)

                firestore.collection("chatRooms").document(room.id)
                    .collection("participants").document(uid)
                    .set(updates, com.google.firebase.firestore.SetOptions.merge())

                startSeatTimeTracking(uid)
            } catch (e: Exception) { /* handle */ }
        }
    }

    fun leaveSeat(targetUid: String? = null) {
        val uid = targetUid ?: auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        _isMicMuted.value = true
        agoraEngine?.setMute(true)
        seatTimeJob?.cancel()
        firestore.collection("chatRooms").document(roomId)
            .collection("participants").document(uid)
            .update(mapOf("seatIndex" to 0, "isMuted" to true, "lastSeen" to FieldValue.serverTimestamp()))
    }

    fun acceptMicRequest(targetUid: String, requestedSeatIndex: Int) {
        val roomId = _room.value?.id ?: return
        viewModelScope.launch {
            try {
                firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(targetUid)
                    .update(mapOf(
                        "seatIndex" to requestedSeatIndex,
                        "isMuted" to false,
                        "isRequestingMic" to false
                    )).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun rejectMicRequest(targetUid: String) {
        val roomId = _room.value?.id ?: return
        viewModelScope.launch {
            try {
                firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(targetUid)
                    .update("isRequestingMic", false).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun lockSeat(seatIdx: Int) {
        val roomId = _room.value?.id ?: return
        val room = _room.value ?: return
        val lockedSeats = room.lockedSeats.toMutableList()
        val isLocked = lockedSeats.contains(seatIdx)
        if (isLocked) lockedSeats.remove(seatIdx) else lockedSeats.add(seatIdx)
        // If locking an occupied seat, evict occupant
        if (!isLocked) {
            _seats.value.find { it.index == seatIdx && it.userId != null }?.let { leaveSeat(it.userId) }
        }
        firestore.collection("chatRooms").document(roomId).update("lockedSeats", lockedSeats)
    }

    fun muteSeat(seatIdx: Int) {
        val roomId = _room.value?.id ?: return
        val room = _room.value ?: return
        val isMuted = room.mutedSeats.contains(seatIdx)
        val update = if (isMuted) FieldValue.arrayRemove(seatIdx) else FieldValue.arrayUnion(seatIdx)
        firestore.collection("chatRooms").document(roomId).update("mutedSeats", update)
    }

    fun kickUser(targetUid: String, durationHours: Int) {
        val roomId = _room.value?.id ?: return
        val kickedUntil = System.currentTimeMillis() + (durationHours * 3600000L)
        viewModelScope.launch {
            try {
                val targetProfileSnap = firestore.collection("users").document(targetUid).collection("profile").document(targetUid).get().await()
                val targetSvip = (targetProfileSnap.get("svip") as? Number)?.toInt() ?: 0
                val avoidBeingKicked = targetProfileSnap.getBoolean("avoidBeingKicked") ?: true
                if (targetSvip >= 13 && avoidBeingKicked) {
                    return@launch
                }
            } catch (e: Exception) {}

            firestore.collection("chatRooms").document(roomId)
                .collection("participants").document(targetUid)
                .update(mapOf("seatIndex" to 0, "isMuted" to true, "kickedUntil" to kickedUntil))

            firestore.collection("chatRooms").document(roomId)
                .collection("entryLogs").add(mapOf(
                    "type" to "kick", "uid" to targetUid,
                    "kickedUntil" to kickedUntil,
                    "by" to (auth.currentUser?.uid ?: ""),
                    "at" to FieldValue.serverTimestamp()
                ))
        }
    }

    fun toggleModStatus(targetUid: String) {
        val room = _room.value ?: return
        if (!_isOwner.value) return
        val mods = room.moderatorIds.toMutableList()
        if (mods.contains(targetUid)) mods.remove(targetUid) else mods.add(targetUid)
        firestore.collection("chatRooms").document(room.id).update("moderatorIds", mods)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MIC TOGGLE
    // ─────────────────────────────────────────────────────────────────────────
    fun toggleMicMute() {
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        val newState = !_isMicMuted.value
        _isMicMuted.value = newState
        agoraEngine?.setMute(newState)
        firestore.collection("chatRooms").document(roomId)
            .collection("participants").document(uid)
            .update(mapOf("isMuted" to newState, "lastSeen" to FieldValue.serverTimestamp()))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    fun addLocalChatClearedMessage(userName: String) {
        val localMsg = MessageModel(
            id = "local_cleared_${System.currentTimeMillis()}",
            content = "$userName cleared the chat",
            type = "system",
            timestamp = com.google.firebase.Timestamp.now()
        )
        _messages.value = _messages.value + localMsg
    }

    fun sendMessage(text: String, imageUrl: String? = null) {
        if (text.isBlank() && imageUrl == null) return
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        viewModelScope.launch {
            try {
                val userDoc = firestore.collection("users").document(uid).get().await()
                var senderName = userDoc.getString("username") ?: userDoc.getString("name")
                var senderAvatar = userDoc.getString("avatarUrl") ?: userDoc.getString("photoURL")

                if (senderName == null || senderAvatar == null) {
                    try {
                        val profileSnap = firestore.collection("users").document(uid)
                            .collection("profile").document(uid).get().await()
                        if (senderName == null) senderName = profileSnap.getString("username") ?: profileSnap.getString("name")
                        if (senderAvatar == null) senderAvatar = profileSnap.getString("avatarUrl") ?: profileSnap.getString("photoURL")
                    } catch (e: Exception) { /* fallback fail */ }
                }

                val msgData = hashMapOf<String, Any?>(
                    "content" to text,
                    "senderId" to uid,
                    "senderName" to (senderName ?: "User"),
                    "senderAvatar" to (senderAvatar ?: ""),
                    "timestamp" to FieldValue.serverTimestamp(),
                    "type" to if (imageUrl != null) "image" else "text",
                    "imageUrl" to imageUrl,
                    "chatRoomId" to roomId
                )
                firestore.collection("chatRooms").document(roomId).collection("messages").add(msgData)
            } catch (e: Exception) { /* handle */ }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMOJI REACTION (SEAT)
    // ─────────────────────────────────────────────────────────────────────────
    fun sendEmojiReaction(emojiType: String) {
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        if (!_isInSeat.value) return // Only seated users can show seat emojis

        viewModelScope.launch {
            try {
                val ref = firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(uid)
                ref.update("activeEmoji", emojiType).await()

                // Auto-clear after 2.5 seconds (matches RN reaction overlay duration)
                delay(2500)
                ref.update("activeEmoji", null).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // EMOJI PICKER (bottom sheet — writes activeEmoji without seat check, matches RN handleSendEmoji)
    fun sendPickerEmoji(emojiId: String) {
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        viewModelScope.launch {
            try {
                val ref = firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(uid)
                ref.set(mapOf("activeEmoji" to emojiId), com.google.firebase.firestore.SetOptions.merge()).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun deleteMessage(messageId: String) {
        val roomId = _room.value?.id ?: return
        firestore.collection("chatRooms").document(roomId).collection("messages").document(messageId).delete()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MIC INVITE
    // ─────────────────────────────────────────────────────────────────────────
    fun sendMicInvite(targetUid: String, seatIndex: Int) {
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        viewModelScope.launch {
            try {
                firestore.collection("chatRooms").document(roomId).collection("messages").add(hashMapOf(
                    "type" to "mic_invite",
                    "senderId" to uid,
                    "targetUid" to targetUid,
                    "seatIndex" to seatIndex,
                    "timestamp" to FieldValue.serverTimestamp()
                ))
                // Award inviter 500 coins
                firestore.collection("users").document(uid).update("wallet.coins", FieldValue.increment(500))
            } catch (e: Exception) { /* handle */ }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEAT TIME TRACKING (every 60s while seated)
    // ─────────────────────────────────────────────────────────────────────────
    private fun startSeatTimeTracking(uid: String) {
        seatTimeJob?.cancel()
        seatTimeJob = viewModelScope.launch {
            while (true) {
                delay(60_000)
                if (!_isInSeat.value) break
                val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                firestore.collection("users").document(uid).update(
                    mapOf(
                        "seatTime.$today" to FieldValue.increment(1),
                        "totalSeatTime" to FieldValue.increment(1)
                    )
                )
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AGORA VOICE ENGINE
    // ─────────────────────────────────────────────────────────────────────────
    private fun initializeAgora(context: Context, roomId: String) {
        agoraEngine = NativeAgoraVoiceEngine(context).apply {
            initializeEngine(
                onUserJoined = {},
                onUserOffline = {},
                onVolumeIndication = { speakers ->
                    val map = speakers?.associate { it.uid to it.volume } ?: emptyMap()
                    _speakingMap.value = map
                    _seats.value = _seats.value.map { seat ->
                        val agoraUid = seat.userId?.hashCode()?.and(0x7FFFFFFF) ?: -1
                        seat.copy(
                            isSpeaking = (map[agoraUid] ?: 0) > 15,
                            speakingIntensity = map[agoraUid] ?: 0
                        )
                    }
                }
            )
        }
        val myUid = auth.currentUser?.uid ?: "guest"
        val numericUid = myUid.hashCode() and 0x7FFFFFFF
        agoraEngine?.joinVoiceChannel(roomId, numericUid, isBroadcaster = true)
        agoraEngine?.setSpeakerMuted(_isSpeakerMuted.value)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXIT ROOM
    // ─────────────────────────────────────────────────────────────────────────
    fun leaveRoom() {
        _isMinimized.value = false
        val uid = auth.currentUser?.uid ?: return
        val roomId = currentRoomId.ifEmpty { _room.value?.id ?: return }
        seatTimeJob?.cancel()
        ghostPurgeJob?.cancel()
        heartbeatJob?.cancel()
        roomPresenceRef?.onDisconnect()?.cancel()
        roomPresenceRef = null
        roomDetailsListener?.remove(); roomDetailsListener = null
        participantsListener?.remove(); participantsListener = null
        messagesListener?.remove(); messagesListener = null
        topSupportersListener?.remove(); topSupportersListener = null
        followListener?.remove(); followListener = null
        rtdbGiftsListener?.let { rtdbGiftsRef?.removeEventListener(it) }; rtdbGiftsRef = null; rtdbGiftsListener = null
        rtdbLootListener?.let { rtdbLootRef?.removeEventListener(it) }; rtdbLootRef = null; rtdbLootListener = null
        agoraEngine?.release()
        agoraEngine = null

        // Delete participant
        firestore.collection("chatRooms").document(roomId)
            .collection("participants").document(uid).delete()
        // Decrement count
        firestore.collection("chatRooms").document(roomId)
            .update("participantCount", FieldValue.increment(-1))
        // Clear user's currentRoomId
        firestore.collection("users").document(uid)
            .update(mapOf("currentRoomId" to null, "isOnline" to true))
            
        // Instantly clear RTDB presence — match React Native: remove entire node
        rtdb.getReference("roomPresence")
            .child(roomId)
            .child(uid)
            .removeValue()
            
        // Clear active room state so home screen doesn't falsely add +1
        currentRoomId = ""
        _room.value = null
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRESENCE + VISIT
    // ─────────────────────────────────────────────────────────────────────────
    private fun recordVisit(roomId: String) {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            try {
                val roomSnap = firestore.collection("chatRooms").document(roomId).get().await()
                val title = roomSnap.getString("name") ?: roomSnap.getString("title") ?: "Room"
                val coverUrl = roomSnap.getString("coverUrl") ?: roomSnap.getString("roomBanner") ?: ""
                val roomNumber = roomSnap.getString("roomNumber") ?: roomSnap.getString("roomId") ?: ""
                val ownerId = roomSnap.getString("ownerId") ?: ""
                
                firestore.collection("users").document(uid).collection("recentVisits").document(roomId)
                    .set(hashMapOf(
                        "id" to roomId,
                        "title" to title,
                        "coverUrl" to coverUrl,
                        "roomNumber" to roomNumber,
                        "ownerId" to ownerId,
                        "visitedAt" to FieldValue.serverTimestamp()
                    ))
            } catch (_: Exception) {
                firestore.collection("users").document(uid).collection("recentVisits").document(roomId)
                    .set(hashMapOf("id" to roomId, "visitedAt" to FieldValue.serverTimestamp()))
            }
        }
        firestore.collection("chatRooms").document(roomId).collection("entryLogs")
            .add(hashMapOf("uid" to uid, "type" to "entry", "at" to FieldValue.serverTimestamp()))
        firestore.collection("chatRooms").document(roomId)
            .update("participantCount", FieldValue.increment(1))
            
        // Add to participants collection as audience (seatIndex = 0) so they show up in User List
        viewModelScope.launch {
            try {
                val userSnap = firestore.collection("users").document(uid).get().await()
                val profileSnap = firestore.collection("users").document(uid).collection("profile").document(uid).get().await()
                val inventory = profileSnap.get("inventory") as? Map<*, *>
                
                // Keep existing seat index if already in a seat (e.g. reconnect)
                val existingPart = firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(uid).get().await()
                
                val currentSeatIndex = if (existingPart.exists()) {
                    (existingPart.getLong("seatIndex") ?: 0L).toInt()
                } else {
                    0
                }

                val updates = hashMapOf<String, Any?>(
                    "seatIndex" to currentSeatIndex,
                    "isMuted" to (currentSeatIndex == 0),
                    "name" to (userSnap.getString("username") ?: userSnap.getString("displayName") ?: "User"),
                    "avatarUrl" to (userSnap.getString("avatarUrl") ?: userSnap.getString("photoURL") ?: ""),
                    "activeFrameMediaUrl" to (inventory?.get("activeFrameMediaUrl") as? String),
                    "activeWave" to (inventory?.get("activeWave") as? String),
                    "lastSeen" to FieldValue.serverTimestamp()
                )
                firestore.collection("chatRooms").document(roomId)
                    .collection("participants").document(uid)
                    .set(updates, com.google.firebase.firestore.SetOptions.merge())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun updateUserPresence(roomId: String) {
        val uid = auth.currentUser?.uid ?: return

        // Firestore user metadata
        firestore.collection("users").document(uid)
            .update(mapOf("currentRoomId" to roomId, "isOnline" to true))

        // RTDB roomPresence — same as RN: { uid, name, avatarUrl, joinedAt, lastSeen, isOnline }
        val presenceRef = rtdb.getReference("roomPresence").child(roomId).child(uid)
        roomPresenceRef = presenceRef
        val joinedAt = com.google.firebase.database.ServerValue.TIMESTAMP
        val lastSeen = com.google.firebase.database.ServerValue.TIMESTAMP
        val userMap = mapOf(
            "uid" to uid,
            "joinedAt" to joinedAt,
            "lastSeen" to lastSeen,
            "isOnline" to true
        )
        presenceRef.setValue(userMap)
        // onDisconnect: server auto-removes node if client crashes/disconnects
        presenceRef.onDisconnect().removeValue()

        // Start 10-second heartbeat — updates lastSeen in RTDB + Firestore
        startHeartbeat(roomId)
    }

    // ── Heartbeat — RN parity: 10s interval updating lastSeen ──────────────
    private fun startHeartbeat(roomId: String) {
        heartbeatJob?.cancel()
        heartbeatJob = viewModelScope.launch {
            while (true) {
                delay(10_000)
                val uid = auth.currentUser?.uid ?: continue
                try {
                    // RTDB lastSeen
                    roomPresenceRef?.child("lastSeen")?.setValue(com.google.firebase.database.ServerValue.TIMESTAMP)
                    // Firestore participant lastSeen
                    firestore.collection("chatRooms").document(roomId)
                        .collection("participants").document(uid)
                        .update("lastSeen", FieldValue.serverTimestamp())
                } catch (_: Exception) {}
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GHOST PURGE — RN global-presence-manager parity (owner-only, every 20s)
    // Purges stale participants: 90s unseated / 5min seated, fixes participantCount
    // ─────────────────────────────────────────────────────────────────────────
    private fun startGhostPurge(roomId: String) {
        ghostPurgeJob?.cancel()
        ghostPurgeJob = viewModelScope.launch {
            while (true) {
                delay(20_000)
                if (!_isOwner.value) continue
                val uid = auth.currentUser?.uid ?: continue
                try {
                    val roomRef = firestore.collection("chatRooms").document(roomId)
                    val roomDocSnap = roomRef.get().await()
                    if (!roomDocSnap.exists()) continue
                    val roomOwnerId = roomDocSnap.getString("ownerId")
                    val storedCount = roomDocSnap.getLong("participantCount") ?: 0L

                    val participantSnaps = roomRef.collection("participants").get().await().documents
                    val now = System.currentTimeMillis()
                    val ghostThreshold = now - 90_000L       // 90s for normal users
                    val seatedGhostThreshold = now - 300_000L // 5 min for seated users
                    val batch = firestore.batch()
                    var activeCount = 0
                    var ghostsFound = 0

                    for (doc in participantSnaps) {
                        // Owner and current user: never purge
                        if (doc.id == roomOwnerId || doc.id == uid) {
                            activeCount++
                            continue
                        }
                        val data = doc.data
                        val lastSeen = (data?.get("lastSeen") as? com.google.firebase.Timestamp)?.toDate()?.time ?: 0L
                        val seatIdx = (data?.get("seatIndex") as? Number)?.toLong()
                        // RN: typeof seatIndex === 'number' && seatIndex >= 0 → seated (5 min threshold)
                        val isSeatedDoc = seatIdx != null && seatIdx >= 0L
                        if (isSeatedDoc) {
                            if (lastSeen < seatedGhostThreshold) {
                                batch.delete(doc.reference)
                                ghostsFound++
                            } else {
                                activeCount++
                            }
                        } else {
                            if (lastSeen < ghostThreshold) {
                                batch.delete(doc.reference)
                                ghostsFound++
                            } else {
                                activeCount++
                            }
                        }
                    }

                    // Always fix participantCount (corrects drift from missed increments/decrements)
                    if (ghostsFound > 0 || activeCount.toLong() != storedCount) {
                        batch.update(
                            roomRef,
                            mapOf(
                                "participantCount" to activeCount,
                                "updatedAt" to FieldValue.serverTimestamp()
                            )
                        )
                        batch.commit().await()
                    }
                } catch (e: Exception) {
                    // silently ignore purge errors (room may have been deleted)
                }
            }
        }
    }

    // ── Tasks Logic ──────────────────────────────────────────────────────────
    private fun listenToRoomTasks() {
        val uid = auth.currentUser?.uid ?: return
        val istNow = System.currentTimeMillis() + (5.5 * 60 * 60 * 1000).toLong()
        val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.format(java.util.Date(istNow))

        tasksListenerRegistration?.remove()
        tasksListenerRegistration = firestore.collection("users").document(uid)
            .collection("roomQuests")
            .addSnapshotListener { snap, _ ->
                val docs = snap?.documents ?: return@addSnapshotListener
                val progress = mutableMapOf<String, Int>()
                val achieved = mutableListOf<String>()
                val claimed = mutableListOf<String>()

                docs.forEach { doc ->
                    val data = doc.data ?: return@forEach
                    val updatedAt = doc.getTimestamp("updatedAt", com.google.firebase.firestore.DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)?.toDate()?.time
                    if (updatedAt != null) {
                        val istUpdate = updatedAt + (5.5 * 60 * 60 * 1000).toLong()
                        val updatedAtStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).apply {
                            timeZone = java.util.TimeZone.getTimeZone("UTC")
                        }.format(java.util.Date(istUpdate))

                        if (updatedAtStr == todayStr) {
                            progress[doc.id] = (data["current"] as? Long)?.toInt() ?: 0
                            if (data["isCompleted"] as? Boolean == true) achieved.add(doc.id)
                            if (data["isClaimed"] as? Boolean == true) claimed.add(doc.id)
                        }
                    }
                }

                // Initialize all tasks
                val fullProgress = mutableMapOf<String, Int>()
                RoomTasksConstants.ROOM_TASKS.forEach { task ->
                    fullProgress[task.id] = progress[task.id] ?: 0
                }

                _taskProgress.value = fullProgress
                _achievedTasks.value = achieved
                _claimedTasks.value = claimed
            }
    }

    fun updateTask(taskId: String, incrementBy: Int = 1) {
        val uid = auth.currentUser?.uid ?: return
        val task = RoomTasksConstants.ROOM_TASKS.find { it.id == taskId } ?: return

        if (_claimedTasks.value.contains(taskId)) return

        val currentVal = (_taskProgress.value[taskId] ?: 0) + incrementBy
        val isNowComplete = currentVal >= task.target

        viewModelScope.launch {
            try {
                firestore.collection("users").document(uid)
                    .collection("roomQuests").document(taskId)
                    .set(
                        mapOf(
                            "current" to currentVal,
                            "target" to task.target,
                            "isCompleted" to isNowComplete,
                            "isClaimed" to _claimedTasks.value.contains(taskId),
                            "updatedAt" to FieldValue.serverTimestamp()
                        ),
                        com.google.firebase.firestore.SetOptions.merge()
                    ).await()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    fun claimTask(taskId: String) {
        val uid = auth.currentUser?.uid ?: return
        val task = RoomTasksConstants.ROOM_TASKS.find { it.id == taskId } ?: return
        if (_claimedTasks.value.contains(taskId)) return

        val isAchieved = _achievedTasks.value.contains(taskId) || (_taskProgress.value[taskId] ?: 0) >= task.target
        if (!isAchieved) return

        viewModelScope.launch {
            try {
                val batch = firestore.batch()
                val taskRef = firestore.collection("users").document(uid).collection("roomQuests").document(taskId)
                val userRef = firestore.collection("users").document(uid)
                val profileRef = firestore.collection("users").document(uid).collection("profile").document(uid)

                batch.update(taskRef, mapOf(
                    "isClaimed" to true,
                    "updatedAt" to FieldValue.serverTimestamp()
                ))
                
                batch.set(userRef, mapOf(
                    "wallet" to mapOf("coins" to FieldValue.increment(task.reward.toLong())),
                    "updatedAt" to FieldValue.serverTimestamp()
                ), com.google.firebase.firestore.SetOptions.merge())

                batch.set(profileRef, mapOf(
                    "wallet" to mapOf("coins" to FieldValue.increment(task.reward.toLong())),
                    "updatedAt" to FieldValue.serverTimestamp()
                ), com.google.firebase.firestore.SetOptions.merge())

                batch.commit().await()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun listenToLootSettings() {
        lootSettingsListener?.remove()
        lootSettingsListener = firestore.collection("appConfig").document("lootSettings")
            .addSnapshotListener { snap, _ ->
                val levelsList = mutableListOf<LootLevel>()
                val rawLevels = snap?.get("levels") as? List<Map<String, Any>>
                if (rawLevels != null && rawLevels.isNotEmpty()) {
                    rawLevels.forEach { map ->
                        levelsList.add(
                            LootLevel(
                                id = map["id"] as? String ?: "",
                                name = map["name"] as? String ?: "",
                                threshold = (map["threshold"] as? Number)?.toLong() ?: 0L,
                                image = map["image"] as? String ?: "",
                                animation = map["animation"] as? String ?: "",
                                voice = map["voice"] as? String ?: ""
                            )
                        )
                    }
                    // Append missing levels from defaults
                    val existingIds = levelsList.map { it.id.lowercase() }
                    LootConstants.DEFAULT_LOOT_LEVELS.forEach { defaultLevel ->
                        if (!existingIds.contains(defaultLevel.id.lowercase())) {
                            levelsList.add(defaultLevel)
                        }
                    }
                } else {
                    levelsList.addAll(LootConstants.DEFAULT_LOOT_LEVELS)
                }
                _lootLevels.value = levelsList
                updateLootProgress(_room.value?.dailyGifts ?: 0L)
            }
    }

    private fun updateLootProgress(dailyGifts: Long) {
        val levels = _lootLevels.value
        if (levels.isEmpty()) return
        
        val lastLevelThreshold = levels.lastOrNull()?.threshold ?: 500000L
        val effectiveProgress = dailyGifts % lastLevelThreshold

        var newIndex = _currentLootLevelIndex.value
        for (i in levels.indices) {
            if (effectiveProgress >= levels[i].threshold) {
                if (_completedGateLevels.value[i] == true) {
                    newIndex = i + 1
                } else {
                    newIndex = i
                    break
                }
            } else {
                newIndex = i
                break
            }
        }
        
        if (newIndex >= levels.size) {
            newIndex = levels.size - 1
        }
        
        if (newIndex != _currentLootLevelIndex.value) {
            _currentLootLevelIndex.value = newIndex
        }
    }

    override fun onCleared() {
        super.onCleared()
        tasksListenerRegistration?.remove()
        lootSettingsListener?.remove()
        lootTimerJob?.cancel()
        leaveRoom()
    }
}

