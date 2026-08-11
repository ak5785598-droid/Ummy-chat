package app.vercel.ummy_chat.twa.data.model

import com.google.firebase.Timestamp

// ── Extended RoomModel ──────────────────────────────────────────────────────
data class RoomModel(
    val id: String = "",
    val title: String = "",
    val ownerId: String = "",
    val ownerName: String = "",
    val announcement: String = "",
    val category: String = "CHAT",
    val seatsCount: Int = 9,
    val onlineCount: Int = 1,
    val themeId: String = "purple_galaxy",
    val coverUrl: String? = null,
    val backgroundUrl: String? = null,
    val roomNumber: String = "",
    val moderatorIds: List<String> = emptyList(),
    val lockedSeats: List<Int> = emptyList(),
    val mutedSeats: List<Int> = emptyList(),
    val bannedUsers: List<String> = emptyList(),
    val password: String? = null,
    val isAIVoiceEnabled: Boolean = false,
    val levelPoints: Long = 0,
    val dailyGifts: Long = 0,
    val totalGifts: Long = 0,
    val visitorCount: Long = 0,
    val uniqueVisitorCount: Long = 0,
    val currentMusicUrl: String? = null,
    val currentMusicTitle: String? = null,
    val chatClearedAt: Timestamp? = null,
    val stats: Map<String, Any>? = null,
    val partners: List<Map<String, Any>>? = null
)

// ── Extended SeatModel ──────────────────────────────────────────────────────
data class SeatModel(
    val index: Int,
    val userId: String? = null,
    val username: String? = null,
    val avatarUrl: String? = null,
    val isMuted: Boolean = false,
    val isLocked: Boolean = false,
    val isSpeaking: Boolean = false,
    val speakingIntensity: Int = 0,
    val activeEmoji: String? = null,
    val activeWave: String? = null,
    val avatarFrameUrl: String? = null,
    val relationship: String? = null,   // "CP" | "BFF" | null
    val bestFriend: String? = null,
    val kickedUntil: Long? = null
)

// ── MessageModel ────────────────────────────────────────────────────────────
data class MessageModel(
    val id: String = "",
    val content: String = "",
    val text: String? = null,
    val senderId: String = "",
    val senderName: String = "",
    val senderAvatar: String? = null,
    val senderChatColor: String? = null,
    val senderBubble: String? = null,
    val senderBubbleMediaUrl: String? = null,
    val type: String = "text",          // text | gift | entrance | lucky-rain | mic_invite | image
    val giftName: String? = null,
    val giftIcon: String? = null,
    val effectUrl: String? = null,
    val mediaUrl: String? = null,
    val imageUrl: String? = null,
    val entryEffectType: String? = null,
    val entryVideoUrl: String? = null,
    val isSfx: Boolean = false,
    val isBattle: Boolean = false,
    val comboCount: Int = 1,
    val isRead: Boolean = false,
    val timestamp: Any? = null,
    val senderSvipLevel: Int = 0
) {
    val displayContent: String get() = content.ifBlank { text ?: "" }
}

// ── EntryEffect ─────────────────────────────────────────────────────────────
data class EntryEffect(
    val username: String = "",
    val avatarUrl: String? = null,
    val effectType: String = "lion",    // slide | fade | bounce | lion | line | dragon
    val mediaUrl: String? = null,
    val videoUrl: String? = null,
    val hasEnteringSound: Boolean = false
)

// ── GiftEvent (RTD) ─────────────────────────────────────────────────────────
data class GiftEvent(
    val id: String = "",
    val senderName: String = "",
    val senderAvatar: String? = null,
    val giftName: String = "",
    val giftIcon: String? = null,
    val effectUrl: String? = null,
    val comboCount: Int = 1,
    val isBattle: Boolean = false,
    val timestamp: Long = 0
)

// ── LootEvent (RTD) ─────────────────────────────────────────────────────────
data class LootEvent(
    val id: String = "",
    val levelName: String = "Home",
    val gateIndex: Int = 0,
    val senderName: String = "",
    val timestamp: Long = 0
)

// ── BroadcastEvent (globalBroadcasts) ───────────────────────────────────────
data class BroadcastEvent(
    val id: String = "",
    val type: String = "gift",          // "gift" | "loot" | "gate_open" | "gate_cracked"
    val roomId: String = "",
    val roomNumber: String = "",
    val senderName: String = "",
    val giftName: String = "",
    val giftImageUrl: String? = null,
    val qty: Int = 1,
    val levelName: String? = null,
    val gateIndex: Int = 0
)

// ── GiftModel ────────────────────────────────────────────────────────────────
data class GiftModel(
    val id: String,
    val name: String,
    val price: Int,
    val category: String = "HOT",
    val iconEmoji: String = "🎁",
    val animationUrl: String? = null,
    val requiredSvipLevel: Int = 0
)

val DEFAULT_GIFTS_LIST = listOf(
    GiftModel("rose",    "Rose",            10,     "HOT",     "🌹"),
    GiftModel("heart",   "Heart",           50,     "HOT",     "❤️"),
    GiftModel("diamond", "Diamond",         200,    "HOT",     "💎"),
    GiftModel("ring",    "Diamond Ring",    500,    "SPECIAL", "💍"),
    GiftModel("crown",   "Crown",           1000,   "SPECIAL", "👑"),
    GiftModel("rocket",  "Rocket",          2000,   "LUXURY",  "🚀"),
    GiftModel("car",     "Sports Car",      5000,   "LUXURY",  "🏎️"),
    GiftModel("castle",  "Royal Castle",    25000,  "LUXURY",  "🏰"),
    GiftModel("dragon",  "Golden Dragon",   100000, "VIP",     "🐉", requiredSvipLevel = 3),
    GiftModel("unicorn", "Mythic Unicorn",  250000, "VIP",     "🦄", requiredSvipLevel = 5)
)

// ── TopSupporter ─────────────────────────────────────────────────────────────
data class TopSupporter(
    val uid: String = "",
    val name: String = "",
    val avatarUrl: String? = null,
    val amount: Long = 0,
    val dailyAmount: Long = 0,
    val weeklyAmount: Long = 0,
    val totalAmount: Long = 0,
    val updatedAt: com.google.firebase.Timestamp? = null
)

// ── RoomParticipant (full profile) ───────────────────────────────────────────
data class RoomParticipant(
    val uid: String = "",
    val name: String = "",
    val avatarUrl: String? = null,
    val seatIndex: Int = 0,
    val isMuted: Boolean = true,
    val isInSeat: Boolean = false,
    val level: Int = 1,
    val vip: Int = 0,
    val coins: Long = 0,
    val isRequestingMic: Boolean = false,
    val requestedSeatIndex: Int = 1
)
