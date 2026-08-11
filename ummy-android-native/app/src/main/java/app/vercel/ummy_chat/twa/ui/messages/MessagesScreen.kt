package app.vercel.ummy_chat.twa.ui.messages

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

@Composable
fun MessagesScreen(
    onOpenChatRoom: (chatId: String, recipientId: String, recipientName: String, recipientAvatar: String) -> Unit,
    onOpenOfficial: () -> Unit = {},
    onOpenSystem: () -> Unit = {},
    onOpenRequests: () -> Unit = {},
    onOpenSearch: () -> Unit = {},
    onOpenRoom: (roomId: String) -> Unit = {}
) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val fs = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()

    var chats by remember { mutableStateOf<List<PrivateChat>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedChatOptions by remember { mutableStateOf<PrivateChat?>(null) }
    var refreshing by remember { mutableStateOf(false) }

    // Notifications for team/system unread counts
    var teamUnread by remember { mutableIntStateOf(0) }
    var systemUnread by remember { mutableIntStateOf(0) }
    var latestTeamMsg by remember { mutableStateOf("") }
    var latestSystemMsg by remember { mutableStateOf("") }

    // Proposals count
    var proposalsPending by remember { mutableIntStateOf(0) }

    // Brand logo
    var brandLogoUrl by remember { mutableStateOf("") }

    // ── Fetch brand logo ──
    LaunchedEffect(Unit) {
        try {
            val doc = fs.collection("appConfig").document("global").get().await()
            brandLogoUrl = doc.getString("customLogoUrl") ?: ""
        } catch (_: Exception) {}
    }

    // ── Fetch notifications (team + system) ──
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        fs.collection("users").document(uid).collection("notifications")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, _ ->
                val docs = snapshot?.documents ?: emptyList()
                val team = docs.filter { it.getString("type") == "system" }
                val system = docs.filter { it.getString("type") == "direct_system" }
                teamUnread = team.count { it.getBoolean("isRead") != true }
                systemUnread = system.count { it.getBoolean("isRead") != true }
                latestTeamMsg = team.firstOrNull()?.getString("content") ?: "Official announcements"
                latestSystemMsg = system.firstOrNull()?.getString("content") ?: "System notices"
            }
    }

    // ── Fetch proposals ──
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        fs.collection("proposals")
            .whereEqualTo("toUid", uid)
            .whereEqualTo("status", "pending")
            .addSnapshotListener { snapshot, _ ->
                proposalsPending = snapshot?.size() ?: 0
            }
    }

    // ── Fetch chats ──
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        isLoading = true
        fs.collection("privateChats")
            .whereArrayContains("participantIds", uid)
            .addSnapshotListener { snapshot, _ ->
                val docs = snapshot?.documents ?: emptyList()
                val chatList = docs.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val pinnedBy = (data["pinnedBy"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                    val updatedAtAny = data["updatedAt"]
                    val updatedAt = when (updatedAtAny) {
                        is com.google.firebase.Timestamp -> updatedAtAny.toDate().time
                        is Long -> updatedAtAny
                        else -> 0L
                    }
                    PrivateChat(
                        id = doc.id,
                        participantIds = data["participantIds"] as? List<String> ?: emptyList(),
                        lastMessage = data["lastMessage"] as? String ?: "Sent a vibe",
                        lastSenderId = data["lastSenderId"] as? String ?: "",
                        lastMessageReadBy = data["lastMessageReadBy"] as? List<String> ?: emptyList(),
                        updatedAt = updatedAt,
                        pinnedBy = pinnedBy
                    )
                }
                // Sort: pinned first, then by updatedAt desc
                chats = chatList.sortedWith(
                    compareByDescending<PrivateChat> { it.pinnedBy.contains(uid) }
                        .thenByDescending { it.updatedAt }
                )
                isLoading = false
            }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // ── Pink Gradient Header ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(128.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFFFF91B5), Color(0x4DFF91B5), Color.Transparent)
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // ── Header ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Messages", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.8f))
                        .clickable { onOpenSearch() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Search, null, tint = Color(0xFF64748B), modifier = Modifier.size(20.dp))
                }
            }

            // ── Chat List ──
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFFFF91B5))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp)
                ) {
                    // ── Ummy Team Row ──
                    item {
                        OfficialSectionCard(
                            title = "Ummy Team",
                            subtitle = latestTeamMsg,
                            iconContent = {
                                if (brandLogoUrl.isNotBlank()) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(brandLogoUrl),
                                        contentDescription = null,
                                        modifier = Modifier
                                            .size(44.dp)
                                            .clip(RoundedCornerShape(14.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(44.dp)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(Color(0xFFFF91B5)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("U", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                                    }
                                }
                            },
                            unreadCount = teamUnread,
                            onClick = { onOpenOfficial() }
                        )
                    }

                    // ── System Row ──
                    item {
                        OfficialSectionCard(
                            title = "System",
                            subtitle = latestSystemMsg,
                            iconContent = {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(Brush.linearGradient(listOf(Color(0xFF4F92FE), Color(0xFF2563EB)))),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Shield, null, tint = Color.White, modifier = Modifier.size(22.dp))
                                }
                            },
                            unreadCount = systemUnread,
                            onClick = { onOpenSystem() }
                        )
                    }

                    // ── Requests Row ──
                    item {
                        OfficialSectionCard(
                            title = "Requests",
                            subtitle = if (proposalsPending > 0) "$proposalsPending pending" else "No pending requests",
                            iconContent = {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(Brush.linearGradient(listOf(Color(0xFFFB7185), Color(0xFFF43F5E)))),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Favorite, null, tint = Color.White, modifier = Modifier.size(22.dp))
                                }
                            },
                            unreadCount = proposalsPending,
                            onClick = { onOpenRequests() }
                        )
                    }

                    // ── Conversations Header ──
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "CONVERSATIONS",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8),
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    // ── Chat Items ──
                    if (chats.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                                Text("No conversations yet", color = Color(0xFF94A3B8), fontSize = 14.sp)
                            }
                        }
                    } else {
                        items(chats, key = { it.id }) { chat ->
                            val otherUid = chat.participantIds.firstOrNull { it != uid } ?: ""
                            ChatListItem(
                                chat = chat,
                                currentUid = uid ?: "",
                                onClick = { name, avatar ->
                                    onOpenChatRoom(chat.id, otherUid, name, avatar)
                                },
                                onLongClick = {
                                    selectedChatOptions = chat
                                },
                                onOpenRoom = onOpenRoom
                            )
                        }
                    }
                }
            }
        }
    }

    // ── Official/System/Requests — now handled via full-screen navigation ──

    // ── Chat Options Modal (Long Press) ──
    if (selectedChatOptions != null) {
        ChatOptionsModal(
            chat = selectedChatOptions!!,
            currentUid = uid ?: "",
            onDismiss = { selectedChatOptions = null },
            onPinUnpin = {
                scope.launch {
                    val isPinned = selectedChatOptions?.pinnedBy?.contains(uid) == true
                    val chatRef = fs.collection("privateChats").document(selectedChatOptions!!.id)
                    chatRef.update(
                        mapOf(
                            "pinnedBy" to if (isPinned) FieldValue.arrayRemove(uid) else FieldValue.arrayUnion(uid)
                        )
                    )
                    selectedChatOptions = null
                }
            },
            onDelete = {
                scope.launch {
                    val chatRef = fs.collection("privateChats").document(selectedChatOptions!!.id)
                    chatRef.update(
                        mapOf("participantIds" to FieldValue.arrayRemove(uid))
                    )
                    selectedChatOptions = null
                }
            }
        )
    }
}

@Composable
fun OfficialSectionCard(
    title: String,
    subtitle: String,
    iconContent: @Composable () -> Unit,
    unreadCount: Int = 0,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        iconContent()
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
            Text(subtitle, fontSize = 12.sp, color = Color(0xFF64748B), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (unreadCount > 0) {
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEF4444)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (unreadCount > 99) "99+" else "$unreadCount",
                    color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF94A3B8), modifier = Modifier.size(18.dp))
    }
}

@Composable
fun ChatOptionsModal(
    chat: PrivateChat,
    currentUid: String,
    onDismiss: () -> Unit,
    onPinUnpin: () -> Unit,
    onDelete: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        shape = RoundedCornerShape(20.dp),
        title = null,
        text = {
            Column {
                val isPinned = chat.pinnedBy.contains(currentUid)
                TextButton(
                    onClick = onPinUnpin,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        if (isPinned) "Unpin from Top" else "Pin to Top",
                        fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                HorizontalDivider(color = Color(0xFFF1F5F9))
                TextButton(
                    onClick = onDelete,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Delete from List", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                }
            }
        },
        confirmButton = {},
        dismissButton = {}
    )
}

// ──────────────────────────────────────────────────────────────────
// OfficialPage — Ummy Team notifications (FULL SCREEN)
// ──────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OfficialPageFullScreen(onBack: () -> Unit) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val fs = FirebaseFirestore.getInstance()
    var messages by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snapshot = fs.collection("users").document(uid)
                .collection("notifications")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().await()
            messages = snapshot.documents.mapNotNull { it.data }

            val unread = snapshot.documents.filter { it.getBoolean("isRead") != true }
            if (unread.isNotEmpty()) {
                val batch = fs.batch()
                unread.forEach { doc -> batch.update(doc.reference, "isRead", true) }
                batch.commit()
            }
        } catch (_: Exception) {}
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ummy Team", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color.White),
            contentPadding = PaddingValues(16.dp)
        ) {
            if (messages.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        Text("No messages", color = Color(0xFF94A3B8), fontSize = 14.sp)
                    }
                }
            } else {
                items(messages.size) { index ->
                    val msg = messages[index]
                    val text = msg["content"] as? String ?: msg["text"] as? String ?: ""
                    val timestamp = msg["timestamp"] as? com.google.firebase.Timestamp
                    val urlRegex = Regex("https?://[^\\s]+")
                    val hasUrl = urlRegex.containsMatchIn(text)
                    val textWithoutUrl = urlRegex.replace(text, "").trim()

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFEEF2FF))
                            .padding(16.dp)
                    ) {
                        Column {
                            if (textWithoutUrl.isNotBlank()) {
                                Text(textWithoutUrl, color = Color(0xFF1E293B), fontSize = 14.sp, lineHeight = 20.sp)
                            }
                            if (hasUrl) {
                                Box(
                                    modifier = Modifier
                                        .padding(top = if (textWithoutUrl.isNotBlank()) 12.dp else 0.dp)
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(Color(0xFFFF6C22))
                                        .clickable { /* Open URL */ }
                                        .padding(horizontal = 20.dp, vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Download, null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Download Now", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            if (timestamp != null) {
                                Text(
                                    timestamp.toDate().toString().take(16),
                                    fontSize = 10.sp,
                                    color = Color(0xFF94A3B8),
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ──────────────────────────────────────────────────────────────────
// SystemPage — System notifications (FULL SCREEN)
// ──────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SystemPageFullScreen(onBack: () -> Unit) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val fs = FirebaseFirestore.getInstance()
    var messages by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snapshot = fs.collection("users").document(uid)
                .collection("notifications")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().await()
            messages = snapshot.documents
                .filter { it.getString("type") == "direct_system" }
                .mapNotNull { it.data }

            val unread = snapshot.documents.filter {
                it.getString("type") == "direct_system" && it.getBoolean("isRead") != true
            }
            if (unread.isNotEmpty()) {
                val batch = fs.batch()
                unread.forEach { doc -> batch.update(doc.reference, "isRead", true) }
                batch.commit()
            }
        } catch (_: Exception) {}
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("System Notices", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color.White),
            contentPadding = PaddingValues(16.dp)
        ) {
            if (messages.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        Text("No notices", color = Color(0xFF94A3B8), fontSize = 14.sp)
                    }
                }
            } else {
                items(messages.size) { index ->
                    val msg = messages[index]
                    val text = msg["content"] as? String ?: msg["text"] as? String ?: ""
                    val timestamp = msg["timestamp"] as? com.google.firebase.Timestamp

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFF8FAFC))
                            .padding(16.dp)
                    ) {
                        Column {
                            Text(text, color = Color(0xFF1E293B), fontSize = 14.sp, lineHeight = 20.sp)
                            if (timestamp != null) {
                                Text(
                                    timestamp.toDate().toString().take(16),
                                    fontSize = 10.sp,
                                    color = Color(0xFF94A3B8),
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ──────────────────────────────────────────────────────────────────
// RequestsPage — Relationship requests (FULL SCREEN)
// ──────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestsPageFullScreen(onBack: () -> Unit) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val fs = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var proposals by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snapshot = fs.collection("proposals")
                .whereEqualTo("toUid", uid)
                .whereEqualTo("status", "pending")
                .get().await()
            proposals = snapshot.documents.mapNotNull { it.data }
        } catch (_: Exception) {}
    }

    fun acceptProposal(proposal: Map<String, Any>) {
        val fromUid = proposal["fromUid"] as? String ?: return
        val cpType = proposal["type"] as? String ?: "cp"
        scope.launch {
            try {
                val sortedIds = listOf(uid!!, fromUid).sorted()
                val pairId = sortedIds.joinToString("_")

                val myCp = fs.collection("cpPairs")
                    .whereEqualTo("type", "CP")
                    .whereArrayContains("participantIds", uid)
                    .get().await()
                if (!myCp.isEmpty) return@launch

                fs.collection("cpPairs").document(pairId).set(
                    mapOf(
                        "id" to pairId,
                        "participantIds" to sortedIds,
                        "type" to cpType,
                        "cpValue" to 0,
                        "level" to 1,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()

                val proposalSnap = fs.collection("proposals")
                    .whereEqualTo("fromUid", fromUid)
                    .whereEqualTo("toUid", uid)
                    .whereEqualTo("status", "pending")
                    .get().await()
                proposalSnap.documents.forEach { doc ->
                    doc.reference.update("status", "accepted")
                }

                proposals = proposals.filter { it["fromUid"] != fromUid }
            } catch (_: Exception) {}
        }
    }

    fun declineProposal(proposal: Map<String, Any>) {
        val fromUid = proposal["fromUid"] as? String ?: return
        scope.launch {
            try {
                val proposalSnap = fs.collection("proposals")
                    .whereEqualTo("fromUid", fromUid)
                    .whereEqualTo("toUid", uid)
                    .whereEqualTo("status", "pending")
                    .get().await()
                proposalSnap.documents.forEach { doc ->
                    doc.reference.update("status", "declined")
                }
                proposals = proposals.filter { it["fromUid"] != fromUid }
            } catch (_: Exception) {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Relationship Requests", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color.White),
            contentPadding = PaddingValues(16.dp)
        ) {
            if (proposals.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.FavoriteBorder, null, tint = Color(0xFFE2E8F0), modifier = Modifier.size(32.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No pending requests", color = Color(0xFF94A3B8), fontSize = 14.sp)
                        }
                    }
                }
            } else {
                items(proposals.size) { index ->
                    val proposal = proposals[index]
                    val fromUid = proposal["fromUid"] as? String ?: ""
                    val type = proposal["type"] as? String ?: "CP"

                    var senderName by remember { mutableStateOf("User") }
                    var senderAvatar by remember { mutableStateOf("") }
                    LaunchedEffect(fromUid) {
                        try {
                            val userDoc = fs.collection("users").document(fromUid).get().await()
                            senderName = userDoc.getString("username") ?: "User"
                            senderAvatar = userDoc.getString("avatarUrl") ?: ""
                        } catch (_: Exception) {}
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFFFF0F5))
                            .border(1.dp, Color(0xFFFECDD3), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = (CdnUtils.toCdn(senderAvatar) ?: "").ifBlank { "https://picsum.photos/100" },
                            contentDescription = null,
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(senderName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                            Text("wants to be your $type", fontSize = 12.sp, color = Color(0xFFDB2777))
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFE2E8F0))
                                    .clickable { declineProposal(proposal) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Decline", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFF472B6))
                                    .clickable { acceptProposal(proposal) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Accept", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}
