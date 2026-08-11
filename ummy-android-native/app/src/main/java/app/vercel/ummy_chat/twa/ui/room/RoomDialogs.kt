package app.vercel.ummy_chat.twa.ui.room

import app.vercel.ummy_chat.twa.util.CdnUtils
import app.vercel.ummy_chat.twa.ui.profile.getLevelFromSpent
import app.vercel.ummy_chat.twa.ui.profile.UserLevelBadge
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.data.model.RoomModel
import app.vercel.ummy_chat.twa.data.model.RoomParticipant
import coil.compose.AsyncImage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.tasks.await
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.sqrt

// ─────────────────────────────────────────────────────────────────────────────
// RoomInfoSheet — mirrors RN RoomInfoSheet (FULL PARITY)
// Real-time room + followers subscriptions, per-user profiles, admin actions
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomInfoSheet(
    roomId: String,
    initialRoom: RoomModel,
    isOwner: Boolean = false,
    isFollowing: Boolean = false,
    onFollow: () -> Unit = {},
    onDismiss: () -> Unit,
    onUserPress: (String) -> Unit = {}
) {
    val firestore = FirebaseFirestore.getInstance()
    
    // Real-time room subscription
    var liveRoom by remember { mutableStateOf(initialRoom) }
    LaunchedEffect(roomId) {
        val reg = firestore.collection("chatRooms").document(roomId)
            .addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    liveRoom = snap.toObject(RoomModel::class.java) ?: initialRoom
                }
            }
        try {
            awaitCancellation()
        } finally {
            reg.remove()
        }
    }

    // Real-time followers subscription
    var followers by remember { mutableStateOf<List<RoomParticipant>>(emptyList()) }
    var followersLoading by remember { mutableStateOf(true) }
    var removedUids by remember { mutableStateOf<Set<String>>(emptySet()) }

    LaunchedEffect(roomId) {
        val reg = firestore.collection("chatRooms").document(roomId).collection("followers")
            .addSnapshotListener { snap, _ ->
                if (snap != null) {
                    val list = snap.documents.map { doc ->
                        val data = doc.data ?: emptyMap()
                        RoomParticipant(
                            uid = doc.id,
                            name = (data["name"] as? String) ?: (data["username"] as? String) ?: "User",
                            avatarUrl = data["avatarUrl"] as? String,
                            seatIndex = (data["seatIndex"] as? Long)?.toInt() ?: 0,
                            isMuted = (data["isMuted"] as? Boolean) ?: true,
                            isInSeat = (data["isInSeat"] as? Boolean) ?: false,
                            level = (data["level"] as? Long)?.toInt() ?: 1,
                            vip = (data["vip"] as? Long)?.toInt() ?: 0,
                            coins = (data["coins"] as? Long) ?: 0L
                        )
                    }
                    followers = list
                    followersLoading = false
                }
            }
        try {
            awaitCancellation()
        } finally {
            reg.remove()
        }
    }

    val visibleFollowers = remember(followers, removedUids) {
        followers.filter { it.uid !in removedUids }
    }

    var activeTab by remember { mutableStateOf("profile") }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color.White,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .size(40.dp, 4.dp)
                    .clip(CircleShape)
                    .background(Color.LightGray.copy(alpha = 0.5f))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f)
                .navigationBarsPadding()
        ) {
            // ── Tabs Navigation Header (RN Parity) ──
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                // Follow/Unfollow button (Absolute Left)
                if (!isOwner) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterStart)
                            .padding(start = 16.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (isFollowing) Color(0xFFEC4899).copy(alpha = 0.1f) else Color(0xFF3B82F6).copy(alpha = 0.1f))
                            .border(0.5.dp, if (isFollowing) Color(0xFFEC4899) else Color(0xFF3B82F6), RoundedCornerShape(4.dp))
                            .clickable { onFollow() }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                if (isFollowing) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                null,
                                tint = if (isFollowing) Color(0xFFEC4899) else Color(0xFF3B82F6),
                                modifier = Modifier.size(10.dp)
                            )
                            Text(
                                if (isFollowing) "UNFOLLOW" else "FOLLOW",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isFollowing) Color(0xFFEC4899) else Color(0xFF3B82F6)
                            )
                        }
                    }
                }

                // Tab Selectors
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    TabItem("PROFILE", activeTab == "profile") { activeTab = "profile" }
                    TabItem("MEMBER (${visibleFollowers.size + 1})", activeTab == "member") { activeTab = "member" }
                }

                // Close button (Absolute Right)
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(end = 12.dp)
                        .size(28.dp)
                        .background(Color(0xFFF1F5F9), CircleShape)
                ) {
                    Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp), tint = Color(0xFF64748B))
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // ── Tab Content ──
            if (activeTab == "profile") {
                RoomProfileTab(liveRoom, visibleFollowers.size)
            } else {
                RoomMembersTab(liveRoom, isOwner, visibleFollowers, followersLoading, removedUids, onUserPress) { uid ->
                    removedUids = removedUids + uid
                }
            }
        }
    }
}

@Composable
fun TabItem(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { onClick() }
            .padding(bottom = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            color = if (isSelected) Color(0xFF2563EB) else Color(0xFFCBD5E1),
            letterSpacing = 0.5.sp
        )
        if (isSelected) {
            Box(modifier = Modifier.width(32.dp).height(3.dp).clip(CircleShape).background(Color(0xFF2563EB)))
        }
    }
}

@Composable
fun RoomProfileTab(room: RoomModel, followerCount: Int) {
    Column(modifier = Modifier.padding(24.dp)) {
        // ── Hero Section (RN Parity) ──
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = room.coverUrl ?: "https://picsum.photos/150",
                contentDescription = null,
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFF8FAFC)),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(room.title, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
                
                // Level Progress (RN L152-160 parity)
                val currentExp = room.levelPoints
                val currentLevel = (sqrt(currentExp.toDouble() / 100)).toInt() + 1
                val nextLevelExp = (currentLevel * currentLevel) * 100L
                val prevLevelExp = ((currentLevel - 1) * (currentLevel - 1)) * 100L
                val progress = if (nextLevelExp > prevLevelExp) {
                    ((currentExp - prevLevelExp).toFloat() / (nextLevelExp - prevLevelExp).toFloat()).coerceIn(0f, 1f)
                } else 1f

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                    Text("Lv.$currentLevel", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0891B2))
                    Text("Lv.${currentLevel + 1}", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFCBD5E1))
                }
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape),
                    color = Color(0xFF22D3EE),
                    trackColor = Color(0xFFF1F5F9)
                )
                Text(
                    "${NumberFormat.getInstance().format(currentExp)} / ${NumberFormat.getInstance().format(nextLevelExp)} EXP",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Stats Bar (RN L170-188 parity) ──
        val tagMap = mapOf(
            "Chat" to Triple("Chat", Color(0xFF3B82F6), Color(0xFFEFF6FF)),
            "Game" to Triple("Game", Color(0xFFA855F7), Color(0xFFFAF5FF)),
            "Music" to Triple("Music", Color(0xFFEC4899), Color(0xFFFDF2F8)),
            "Party" to Triple("Party", Color(0xFFF97316), Color(0xFFFFF7ED))
        )
        val (tagLabel, tagColor, tagBg) = tagMap[room.category] ?: tagMap["Chat"]!!

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .drawBehind {
                    val strokeWidth = 1.dp.toPx()
                    drawLine(Color(0xFFF1F5F9), Offset(0f, size.height), Offset(size.width, size.height), strokeWidth)
                },
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            InfoStat("MEMBERS", "${followerCount + 1}")
            InfoStat("LANGUAGE", "Hindi")
            Column(horizontalAlignment = Alignment.End) {
                Text("TAG", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(tagBg).padding(horizontal = 10.dp, vertical = 2.dp)) {
                    Text(tagLabel, color = tagColor, fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Announcement (RN L191-197 parity) ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFFF8FAFC))
                .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(20.dp))
                .padding(16.dp)
        ) {
            Text("ANNOUNCEMENT", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                room.announcement.ifEmpty { "No announcement set." },
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF475569),
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
fun InfoStat(label: String, value: String) {
    Column {
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
    }
}

@Composable
fun RoomMembersTab(
    room: RoomModel,
    isMeOwner: Boolean,
    members: List<RoomParticipant>,
    followersLoading: Boolean,
    removedUids: Set<String>,
    onUserPress: (String) -> Unit,
    onRemoveMember: (String) -> Unit
) {
    val firestore = FirebaseFirestore.getInstance()

    // Build combined member list for LazyColumn
    val visibleMembers = remember(members, removedUids) {
        members.filter { it.uid !in removedUids }
    }
    val memberItems = buildList {
        // Stats header
        add(MemberItem.Header(
            adminCount = room.moderatorIds.size,
            memberCount = visibleMembers.size + 1
        ))
        // Loading state
        if (followersLoading) add(MemberItem.Loading)
        // Owner
        val ownerUid = room.ownerId
        if (ownerUid !in removedUids) add(MemberItem.User(ownerUid, "owner"))
        // Moderators
        room.moderatorIds.filter { it != room.ownerId && it !in removedUids }.forEach { modId ->
            add(MemberItem.User(modId, "admin"))
        }
        // Followers
        visibleMembers.filter { it.uid != room.ownerId && it.uid !in room.moderatorIds }.forEach { member ->
            add(MemberItem.User(member.uid, "follower"))
        }
    }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp)) {
        item {  // Stats Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFF8FAFC))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Admins: ${room.moderatorIds.size}/10", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                Text("Members: ${visibleMembers.size + 1}", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
            }
        }
        items(memberItems) { item ->
            when (item) {
                is MemberItem.Loading -> {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF3B82F6), modifier = Modifier.size(24.dp))
                    }
                }
                is MemberItem.User -> {
                    MemberRowWithActions(
                        uid = item.uid,
                        role = item.role,
                        isMeOwner = isMeOwner,
                        firestore = firestore,
                        roomId = room.id,
                        onUserPress = onUserPress,
                        onRemoveMember = onRemoveMember
                    )
                }
                is MemberItem.Header -> { /* Already rendered as first item */ }
            }
        }
    }
}

sealed interface MemberItem {
    data class Header(val adminCount: Int, val memberCount: Int) : MemberItem
    object Loading : MemberItem
    data class User(val uid: String, val role: String) : MemberItem
}

@Composable
fun MemberRowWithActions(
    uid: String,
    role: String,
    isMeOwner: Boolean,
    firestore: FirebaseFirestore,
    roomId: String,
    onUserPress: (String) -> Unit,
    onRemoveMember: (String) -> Unit
) {
    var username by remember { mutableStateOf("Loading...") }
    var avatarUrl by remember { mutableStateOf<String?>(null) }
    var gender by remember { mutableStateOf<String?>(null) }
    var level by remember { mutableStateOf(1) }
    var isLoading by remember { mutableStateOf(true) }

    DisposableEffect(uid) {
        if (uid.isBlank()) {
            isLoading = false
            onDispose {}
        } else {
            var baseData: Map<String, Any>? = null
            var subData: Map<String, Any>? = null
            var baseLoaded = false
            var subLoaded = false

            val baseRef = firestore.collection("users").document(uid)
            val subRef = baseRef.collection("profile").document(uid)

            fun updateMerged() {
                if (baseLoaded && subLoaded) {
                    val b = baseData
                    val s = subData

                    username = (s?.get("username") as? String)
                        ?: (b?.get("username") as? String)
                        ?: (s?.get("name") as? String)
                        ?: (b?.get("name") as? String)
                        ?: (s?.get("displayName") as? String)
                        ?: (b?.get("displayName") as? String)
                        ?: "User"

                    avatarUrl = (s?.get("avatarUrl") as? String)
                        ?: (b?.get("avatarUrl") as? String)
                        ?: (s?.get("photoURL") as? String)
                        ?: (b?.get("photoURL") as? String)

                    gender = (s?.get("gender") as? String) ?: (b?.get("gender") as? String)

                    val levelVal = (b?.get("level") as? Number)?.toInt()
                        ?: (s?.get("level") as? Number)?.toInt()

                    if (levelVal != null) {
                        level = levelVal
                    } else {
                        val spent = (b?.get("wallet") as? Map<*, *>)?.get("totalSpent") as? Number
                            ?: (s?.get("wallet") as? Map<*, *>)?.get("totalSpent") as? Number
                            ?: (b?.get("totalSpent") as? Number)
                            ?: (s?.get("totalSpent") as? Number)
                            ?: 0L
                        level = getLevelFromSpent(spent.toLong())
                    }
                    isLoading = false
                }
            }

            val baseListener = baseRef.addSnapshotListener { snap, error ->
                if (error != null) error.printStackTrace()
                baseData = snap?.data
                baseLoaded = true
                updateMerged()
            }

            val subListener = subRef.addSnapshotListener { snap, error ->
                if (error != null) error.printStackTrace()
                subData = snap?.data
                subLoaded = true
                updateMerged()
            }

            onDispose {
                baseListener.remove()
                subListener.remove()
            }
        }
    }

    if (isLoading) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .padding(bottom = 6.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFFF8FAFC))
        )
        return
    }

    val isModerator = role == "admin"
    val showActions = role != "owner" && isMeOwner

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFF8FAFC).copy(alpha = 0.4f))
            .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            .clickable { onUserPress(uid) }
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = CdnUtils.toCdn(avatarUrl) ?: "https://api.dicebear.com/7.x/initials/png?seed=$username",
                contentDescription = null,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .border(1.dp, Color(0xFFE2E8F0), CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(username, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF1E293B))
                    when (role) {
                        "owner" -> Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFFFACC15)).padding(horizontal = 5.dp).height(14.dp), contentAlignment = Alignment.Center) {
                            Text("OWNER", color = Color.White, fontSize = 7.sp, fontWeight = FontWeight.Black, modifier = Modifier.offset(y = (-3).dp))
                        }
                        "admin" -> Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFFA855F7)).padding(horizontal = 5.dp).height(14.dp), contentAlignment = Alignment.Center) {
                            Text("ADMIN", color = Color.White, fontSize = 7.sp, fontWeight = FontWeight.Black, modifier = Modifier.offset(y = (-3).dp))
                        }
                    }
                }
                // Gender + Level
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    gender?.let { g ->
                        val (bgColor, icon) = if (g == "Female") Color(0xFFEC4899) to "\u2640" else Color(0xFF3B82F6) to "\u2642"
                        Box(modifier = Modifier.size(18.dp).clip(CircleShape).background(bgColor), contentAlignment = Alignment.Center) {
                            Text(icon, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.offset(y = (-2).dp))
                        }
                    }
                    // Level badge
                    UserLevelBadge(level = level, scale = 0.9f)
                }
            }
            // 3-dots menu for owner
            if (showActions) {
                var showOptions by remember { mutableStateOf(false) }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF1F5F9))
                        .clickable { showOptions = !showOptions },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Options", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                }
                if (showOptions) {
                    AlertDialog(
                        onDismissRequest = { showOptions = false },
                        title = { Text("Member Options", color = Color(0xFF1E293B), fontWeight = FontWeight.Bold) },
                        text = { Text("Choose action for $username:", color = Color(0xFF475569)) },
                        confirmButton = {
                            TextButton(onClick = { 
                                // Toggle admin
                                firestore.collection("chatRooms").document(roomId)
                                    .update("moderatorIds", if (isModerator) FieldValue.arrayRemove(uid) else FieldValue.arrayUnion(uid))
                                showOptions = false
                            }) {
                                Text(if (isModerator) "Remove Admin Status" else "Make Admin", color = Color(0xFF3B82F6), fontWeight = FontWeight.Bold)
                            }
                        },
                        dismissButton = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = { 
                                    // Remove member
                                    firestore.collection("chatRooms").document(roomId)
                                        .collection("followers").document(uid).delete()
                                    firestore.collection("users").document(uid)
                                        .collection("followedRooms").document(roomId).delete()
                                    onRemoveMember(uid)
                                    showOptions = false
                                }) {
                                    Text("Remove Member", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                                }
                                TextButton(onClick = { showOptions = false }) {
                                    Text("Cancel", color = Color(0xFF64748B))
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomExitSheet — mirrors RN ExitRoomSheet (FULL PARITY)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun RoomExitSheet(
    onDismiss: () -> Unit,
    onExit: () -> Unit,
    onMinimize: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.4f))
                .clickable(onClick = onDismiss),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(40.dp)
            ) {
                // 1. KEEP / MINIMIZE BUTTON
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF00E5FF))
                            .shadow(12.dp, CircleShape, spotColor = Color(0xFF00E5FF))
                            .clickable { 
                                onMinimize()
                                onDismiss() 
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Minimize, 
                            contentDescription = "Keep",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Text(
                        "Keep",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        letterSpacing = 1.sp
                    )
                }

                // 2. EXIT BUTTON
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF00E5FF))
                            .shadow(12.dp, CircleShape, spotColor = Color(0xFF00E5FF))
                            .clickable { 
                                onExit()
                                onDismiss()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PowerSettingsNew,
                            contentDescription = "Exit",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Text(
                        "Exit",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        letterSpacing = 1.sp
                    )
                }
            }

            // Bottom Close Button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 48.dp)
                    .size(48.dp)
                    .background(Color.White.copy(alpha = 0.1f), CircleShape)
            ) {
                Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
            }
        }
    }
}

@Composable
fun ChatInputDialog(onDismiss: () -> Unit, onSend: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color(0xFF1E1B4B)).padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = text, onValueChange = { text = it }, placeholder = { Text("Say something... 💬", color = Color.White.copy(alpha = 0.4f)) }, modifier = Modifier.weight(1f), shape = CircleShape, singleLine = true, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color.White.copy(alpha = 0.2f), cursorColor = Color(0xFF8B5CF6)))
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(onClick = { if (text.isNotBlank()) { onSend(text.trim()); onDismiss() } }, modifier = Modifier.size(44.dp).clip(CircleShape).background(Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899))))) { Icon(imageVector = Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(20.dp)) }
            }
        }
    }
}
