package app.vercel.ummy_chat.twa.ui.room

import android.content.Context
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
    private val sessionJoinTime = System.currentTimeMillis()
    private var seatTimeJob: Job? = null

    // ── Core Room State ──────────────────────────────────────────────────────
    private val _room = MutableStateFlow<RoomModel?>(null)
    val room: StateFlow<RoomModel?> = _room.asStateFlow()

    private val _seats = MutableStateFlow<List<SeatModel>>((1..9).map { SeatModel(index = it) })
    val seats: StateFlow<List<SeatModel>> = _seats.asStateFlow()

    private val _messages = MutableStateFlow<List<MessageModel>>(emptyList())
    val messages: StateFlow<List<MessageModel>> = _messages.asStateFlow()

    // ── Current User State ───────────────────────────────────────────────────
    private val _isMicMuted = MutableStateFlow(true)
    val isMicMuted: StateFlow<Boolean> = _isMicMuted.asStateFlow()

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

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    fun initializeRoom(context: Context, roomId: String) {
        _isMinimized.value = false
        currentRoomId = roomId
        listenToRoomDetails(roomId)
        listenToParticipants(roomId)
        listenToMessages(roomId)
        listenToTopSupporters(roomId)
        listenToGlobalBroadcasts()
        listenToRtdbGifts(roomId)
        listenToRtdbLoot(roomId)
        checkFollowStatus(roomId)
        initializeAgora(context, roomId)
        recordVisit(roomId)
        updateUserPresence(roomId)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIRESTORE LISTENERS
    // ─────────────────────────────────────────────────────────────────────────
    private fun listenToRoomDetails(roomId: String) {
        firestore.collection("chatRooms").document(roomId)
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
                    currentMusicUrl = snap.getString("currentMusicUrl"),
                    currentMusicTitle = snap.getString("currentMusicTitle"),
                    chatClearedAt = snap.getTimestamp("chatClearedAt")
                )
            }
    }

    private fun listenToParticipants(roomId: String) {
        firestore.collection("chatRooms").document(roomId)
            .collection("participants")
            .addSnapshotListener { snap, _ ->
                val uid = auth.currentUser?.uid ?: ""
                val docs = snap?.documents ?: return@addSnapshotListener
                val room = _room.value
                val maxSeats = room?.seatsCount ?: 9
                val lockedSeats = room?.lockedSeats ?: emptyList()
                val mutedSeats = room?.mutedSeats ?: emptyList()

                val participants = docs.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val seatIdx = (data["seatIndex"] as? Long)?.toInt() ?: 0
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

                _onlineCount.value = participants.size
                val seated = participants.filter { it.index in 1..maxSeats }

                _seats.value = (1..maxSeats).map { idx ->
                    val occupant = seated.find { it.index == idx }
                    occupant ?: SeatModel(
                        index = idx,
                        isLocked = lockedSeats.contains(idx)
                    )
                }

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

    private fun listenToMessages(roomId: String) {
        val queryFrom = com.google.firebase.Timestamp(java.util.Date(sessionJoinTime - 3000))
        
        firestore.collection("chatRooms").document(roomId)
            .collection("messages")
            .whereGreaterThan("timestamp", queryFrom) // RN L733 parity: Only show new messages
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .limit(100)
            .addSnapshotListener { snap, _ ->
                val roomSnap = _room.value
                val clearedAt = roomSnap?.chatClearedAt ?: com.google.firebase.Timestamp(java.util.Date(0))
                
                val msgs = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val ts = data["timestamp"] as? com.google.firebase.Timestamp ?: com.google.firebase.Timestamp.now()
                    
                    // Filter by chatClearedAt (web/RN logic)
                    if (ts < clearedAt && (data["type"] as? String) != "system") return@mapNotNull null

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
                        imageUrl = data["imageUrl"] as? String,
                        entryEffectType = data["entryEffectType"] as? String,
                        isSfx = data["isSfx"] as? Boolean ?: false,
                        isBattle = data["isBattle"] as? Boolean ?: false,
                        comboCount = (data["comboCount"] as? Long)?.toInt() ?: 1,
                        timestamp = ts
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
        firestore.collection("chatRooms").document(roomId)
            .collection("topSupporters")
            .orderBy("dailyAmount", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                _topSupporters.value = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    TopSupporter(
                        uid = doc.id,
                        name = data["name"] as? String ?: "",
                        avatarUrl = data["avatarUrl"] as? String,
                        dailyAmount = data["dailyAmount"] as? Long ?: 0L,
                        totalAmount = data["totalAmount"] as? Long ?: 0L,
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
        rtdb.getReference("roomGifts/$roomId/lastGift")
            .addValueEventListener(object : ValueEventListener {
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
            })
    }

    private fun listenToRtdbLoot(roomId: String) {
        rtdb.getReference("roomLoot/$roomId/lastLoot")
            .addValueEventListener(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val data = snapshot.value as? Map<*, *> ?: return
                    val id = data["id"] as? String ?: return
                    val ts = data["timestamp"] as? Long ?: 0L
                    if (processedIds.contains(id) || ts < sessionJoinTime) return
                    processedIds.add(id)
                    // Level animation trigger via BroadcastEvent
                    val evt = BroadcastEvent(
                        id = id, type = "loot",
                        senderName = data["senderName"] as? String ?: "",
                        levelName = data["levelName"] as? String ?: "Home",
                        roomNumber = currentRoomId
                    )
                    showLootBroadcast(evt)
                }
                override fun onCancelled(error: DatabaseError) {}
            })
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
        if (msg.senderId == auth.currentUser?.uid) return
        _entryEffect.value = EntryEffect(
            username = msg.senderName,
            avatarUrl = msg.senderAvatar,
            effectType = msg.entryEffectType ?: "slide",
            mediaUrl = msg.effectUrl
        )
        viewModelScope.launch {
            delay(5000)
            _entryEffect.value = null
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FOLLOW / UNFOLLOW ROOM
    // ─────────────────────────────────────────────────────────────────────────
    private fun checkFollowStatus(roomId: String) {
        val uid = auth.currentUser?.uid ?: return
        firestore.collection("users").document(uid).collection("followedRooms").document(roomId)
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
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXIT ROOM
    // ─────────────────────────────────────────────────────────────────────────
    fun leaveRoom() {
        _isMinimized.value = false
        val uid = auth.currentUser?.uid ?: return
        val roomId = _room.value?.id ?: return
        seatTimeJob?.cancel()
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
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRESENCE + VISIT
    // ─────────────────────────────────────────────────────────────────────────
    private fun recordVisit(roomId: String) {
        val uid = auth.currentUser?.uid ?: return
        firestore.collection("users").document(uid).collection("recentVisits").document(roomId)
            .set(hashMapOf("id" to roomId, "visitedAt" to FieldValue.serverTimestamp()))
        firestore.collection("chatRooms").document(roomId).collection("entryLogs")
            .add(hashMapOf("uid" to uid, "type" to "entry", "at" to FieldValue.serverTimestamp()))
        firestore.collection("chatRooms").document(roomId)
            .update("participantCount", FieldValue.increment(1))
    }

    private fun updateUserPresence(roomId: String) {
        val uid = auth.currentUser?.uid ?: return
        firestore.collection("users").document(uid)
            .update(mapOf("currentRoomId" to roomId, "isOnline" to true))
    }

    override fun onCleared() {
        super.onCleared()
        leaveRoom()
    }
}
