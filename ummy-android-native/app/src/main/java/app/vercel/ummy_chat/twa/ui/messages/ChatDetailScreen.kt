package app.vercel.ummy_chat.twa.ui.messages

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

data class ChatMessage(
    val id: String = "",
    val text: String? = null,
    val senderId: String = "",
    val timestamp: Long = 0L,
    val imageUrl: String? = null,
    val isGift: Boolean = false,
    val giftName: String? = null,
    val coinAmount: Int = 0,
    val voiceUrl: String? = null,
    val duration: Int = 0,
    val isRead: Boolean = false,
    val isEdited: Boolean = false,
    val roomInvite: RoomInvite? = null,
    val type: String = "text"
)

data class RoomInvite(
    val roomId: String = "",
    val roomName: String = "",
    val hostName: String = "",
    val thumbnailUrl: String = ""
)

private val QUICK_EMOJIS = listOf(
    "\uD83D\uDE0A", "\uD83E\uDD29", "\uD83D\uDE0D", "\uD83D\uDE02",
    "\uD83D\uDE2D", "\uD83E\uDD14", "\uD83D\uDE31", "\uD83C\uDF89",
    "\uD83D\uDC4D", "\uD83D\uDC4E", "\u2764\uFE0F", "\uD83D\uDC94",
    "\uD83D\uDCA5", "\uD83D\uDCAB", "\uD83D\uDC40", "\uD83D\uDCA9"
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun ChatDetailScreen(
    navController: NavController,
    chatId: String,
    recipientId: String,
    recipientName: String,
    recipientAvatar: String,
    recipientIsOnline: Boolean
) {
    val firestore = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val currentUserId = auth.currentUser?.uid ?: ""
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    var showEmojiPicker by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    var showGiftPicker by remember { mutableStateOf(false) }
    var recipientCoins by remember { mutableIntStateOf(0) }

    // Live recipient data from Firestore
    var liveRecipientName by remember { mutableStateOf(recipientName) }
    var liveRecipientAvatar by remember { mutableStateOf(recipientAvatar) }
    var liveRecipientOnline by remember { mutableStateOf(recipientIsOnline) }
    var liveRecipientLastSeen by remember { mutableStateOf<com.google.firebase.Timestamp?>(null) }
    var liveRecipientShowLastSeen by remember { mutableStateOf(true) }
    // Current user avatar
    var myAvatar by remember { mutableStateOf("") }
    // My profile showLastSeen
    var myShowLastSeen by remember { mutableStateOf(true) }

    // Edit state
    var editingMessage by remember { mutableStateOf<ChatMessage?>(null) }

    // Selected message for long press
    var selectedMessage by remember { mutableStateOf<ChatMessage?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    // Image picker
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    var isUploading by remember { mutableStateOf(false) }

    // Image preview
    var previewImageUrl by remember { mutableStateOf<String?>(null) }

    // Report / Block / Last Seen
    var showActions by remember { mutableStateOf(false) }
    var isBlocked by remember { mutableStateOf(false) }
    var showLastSeenSetting by remember { mutableStateOf(true) }

    val listState = rememberLazyListState()

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            imageUri = uri
        }
    }

    // Fetch recipient coins
    LaunchedEffect(recipientId) {
        try {
            val userDoc = firestore.collection("users").document(recipientId).get().await()
            recipientCoins = (userDoc.getLong("coins") ?: 0L).toInt()
        } catch (_: Exception) {}
    }

    // Fetch current user avatar
    LaunchedEffect(currentUserId) {
        if (currentUserId.isBlank()) return@LaunchedEffect
        firestore.collection("users").document(currentUserId)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    myAvatar = snapshot.getString("avatarUrl")
                        ?: snapshot.getString("photoURL")
                        ?: snapshot.getString("profileImage") ?: ""
                }
            }
    }

    // Live listener for recipient profile (avatar, name, online, lastSeen)
    LaunchedEffect(recipientId) {
        if (recipientId.isBlank()) return@LaunchedEffect
        firestore.collection("users").document(recipientId)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    liveRecipientName = snapshot.getString("username")
                        ?: snapshot.getString("displayName")
                        ?: snapshot.getString("name") ?: liveRecipientName
                    liveRecipientAvatar = snapshot.getString("avatarUrl")
                        ?: snapshot.getString("photoURL")
                        ?: snapshot.getString("profileImage") ?: liveRecipientAvatar
                    liveRecipientOnline = snapshot.getBoolean("isOnline") ?: false
                    liveRecipientLastSeen = snapshot.getTimestamp("lastSeen")
                }
            }
    }

    // Load my profile showLastSeen + blockedUsers
    LaunchedEffect(currentUserId) {
        if (currentUserId.isBlank()) return@LaunchedEffect
        val myProfileRef = firestore.collection("users").document(currentUserId)
            .collection("profile").document(currentUserId)
        myProfileRef.addSnapshotListener { snap, _ ->
            if (snap != null && snap.exists()) {
                showLastSeenSetting = snap.getBoolean("showLastSeen") != false
                myShowLastSeen = snap.getBoolean("showLastSeen") != false
                val blocked: List<String> = snap.get("blockedUsers") as? List<String> ?: emptyList()
                isBlocked = blocked.contains(recipientId)
            }
        }
    }

    // ── Messages listener ──
    LaunchedEffect(chatId) {
        firestore.collection("privateChats").document(chatId)
            .collection("messages")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                if (snapshot != null) {
                    val msgs = snapshot.documents.mapNotNull { doc ->
                        val data = doc.data ?: return@mapNotNull null
                        val roomInviteMap = data["roomInvite"] as? Map<*, *>
                        ChatMessage(
                            id = doc.id,
                            text = data["text"] as? String,
                            senderId = data["senderId"] as? String ?: "",
                            timestamp = (data["timestamp"] as? com.google.firebase.Timestamp)?.toDate()?.time ?: 0L,
                            imageUrl = data["imageUrl"] as? String,
                            isGift = data["isGift"] as? Boolean ?: false,
                            giftName = data["giftName"] as? String,
                            coinAmount = (data["coinAmount"] as? Long)?.toInt() ?: 0,
                            voiceUrl = data["voiceUrl"] as? String,
                            duration = (data["duration"] as? Long)?.toInt() ?: 0,
                            isRead = data["isRead"] as? Boolean ?: false,
                            isEdited = data["isEdited"] as? Boolean ?: false,
                            type = data["type"] as? String ?: "text",
                            roomInvite = roomInviteMap?.let {
                                RoomInvite(
                                    roomId = it["roomId"] as? String ?: "",
                                    roomName = it["roomName"] as? String ?: "",
                                    hostName = it["hostName"] as? String ?: "",
                                    thumbnailUrl = it["thumbnailUrl"] as? String ?: ""
                                )
                            }
                        )
                    }
                    messages = msgs
                }
            }
    }

    // ── Auto-scroll to bottom ──
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // ── Upload image ──
    LaunchedEffect(imageUri) {
        if (imageUri == null || isUploading) return@LaunchedEffect
        isUploading = true
        try {
            val storageRef = FirebaseStorage.getInstance().reference
                .child("chat_images/$chatId/${System.currentTimeMillis()}.jpg")
            storageRef.putFile(imageUri!!).await()
            val downloadUrl = storageRef.downloadUrl.await().toString()

            val messageMap = hashMapOf(
                "imageUrl" to downloadUrl,
                "senderId" to currentUserId,
                "timestamp" to FieldValue.serverTimestamp(),
                "isRead" to false,
                "type" to "image"
            )
            firestore.collection("privateChats").document(chatId)
                .collection("messages").add(messageMap).await()

            firestore.collection("privateChats").document(chatId).update(
                mapOf(
                    "lastMessage" to "📷 Photo",
                    "lastSenderId" to currentUserId,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
        } catch (_: Exception) {}
        imageUri = null
        isUploading = false
    }

    // ── Send text message ──
    fun sendTextMessage() {
        val text = inputText.trim()
        if (text.isBlank()) return
        inputText = ""

        if (editingMessage != null) {
            // Edit existing message
            val msgRef = firestore.collection("privateChats").document(chatId)
                .collection("messages").document(editingMessage!!.id)
            msgRef.update(
                mapOf(
                    "text" to text,
                    "isEdited" to true
                )
            )
            editingMessage = null
            return
        }

        val messageMap = hashMapOf(
            "text" to text,
            "senderId" to currentUserId,
            "timestamp" to FieldValue.serverTimestamp(),
            "isRead" to false,
            "type" to "text"
        )
        firestore.collection("privateChats").document(chatId)
            .collection("messages").add(messageMap)

        firestore.collection("privateChats").document(chatId).update(
            mapOf(
                "lastMessage" to text,
                "lastSenderId" to currentUserId,
                "updatedAt" to FieldValue.serverTimestamp()
            )
        )
    }

    // ── Delete message ──
    fun deleteMessage(msg: ChatMessage) {
        firestore.collection("privateChats").document(chatId)
            .collection("messages").document(msg.id).delete()
        showDeleteDialog = false
        selectedMessage = null
    }

    // ── Clear chat ──
    fun clearChat() {
        scope.launch {
            val msgs = firestore.collection("privateChats").document(chatId)
                .collection("messages").get().await()
            for (doc in msgs.documents) {
                doc.reference.delete().await()
            }
            firestore.collection("privateChats").document(chatId).update(
                mapOf("lastMessage" to "Chat cleared", "updatedAt" to FieldValue.serverTimestamp())
            )
        }
        showMenu = false
    }

    // ── Delete chat ──
    fun deleteChat() {
        scope.launch {
            val msgs = firestore.collection("privateChats").document(chatId)
                .collection("messages").get().await()
            for (doc in msgs.documents) {
                doc.reference.delete().await()
            }
            firestore.collection("privateChats").document(chatId).delete().await()
        }
        showMenu = false
        navController.navigate("main/messages") {
            popUpTo("main/messages") { inclusive = true }
        }
    }

    // ── Block user ──
    fun blockUser() {
        scope.launch {
            val currentUser = auth.currentUser ?: return@launch
            firestore.collection("users").document(currentUser.uid)
                .update("blockedUsers", FieldValue.arrayUnion(recipientId)).await()
        }
        showMenu = false
        navController.navigate("main/messages") {
            popUpTo("main/messages") { inclusive = true }
        }
    }

    // Compute last seen text (RN format)
    val isRecipientOnline = remember(liveRecipientOnline, liveRecipientLastSeen) {
        liveRecipientOnline && liveRecipientLastSeen != null &&
                (System.currentTimeMillis() - (liveRecipientLastSeen?.toDate()?.time ?: 0)) < 120000
    }
    val lastSeenText = remember(liveRecipientLastSeen, liveRecipientShowLastSeen, isRecipientOnline) {
        if (isRecipientOnline) "online"
        else if (!liveRecipientShowLastSeen) ""
        else formatLastSeen(liveRecipientLastSeen)
    }

    // Compute isOnline for chat list "In Room" badge
    val isOnline = remember(liveRecipientOnline, liveRecipientLastSeen) {
        liveRecipientOnline && liveRecipientLastSeen != null &&
                (System.currentTimeMillis() - (liveRecipientLastSeen?.toDate()?.time ?: 0)) < 120000
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Avatar (tappable for profile)
                            Box(modifier = Modifier.size(40.dp)) {
                                AsyncImage(
                                    model = (CdnUtils.toCdn(liveRecipientAvatar) ?: "").ifBlank {
                                        "https://ui-avatars.com/api/?name=$liveRecipientName"
                                    },
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize().clip(CircleShape)
                                        .background(Color(0xFFE2E8F0))
                                )
                                if (isRecipientOnline) {
                                    Box(
                                        modifier = Modifier
                                            .size(12.dp)
                                            .align(Alignment.BottomEnd)
                                            .clip(CircleShape)
                                            .background(Color(0xFF22C55E))
                                            .border(2.dp, Color.White, CircleShape)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(liveRecipientName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                Text(
                                    lastSeenText,
                                    fontSize = 12.sp,
                                    color = if (isRecipientOnline) Color(0xFF22C55E) else Color(0xFF94A3B8),
                                    fontWeight = if (isRecipientOnline) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            navController.navigate("main/messages") {
                                popUpTo("main/messages") { inclusive = true }
                            }
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color(0xFF64748B))
                        }
                    },
                    actions = {
                        IconButton(onClick = { showActions = !showActions }) {
                            Icon(Icons.Default.MoreVert, "Menu", tint = Color(0xFF64748B))
                        }
                        // 3-dot dropdown matching RN
                        DropdownMenu(expanded = showActions, onDismissRequest = { showActions = false }) {
                            // Report User
                            DropdownMenuItem(
                                text = { Text("Report User", color = Color(0xFF1E293B), fontSize = 14.sp) },
                                onClick = {
                                    showActions = false
                                    scope.launch {
                                        try {
                                            val reportData = hashMapOf(
                                                "reporterId" to currentUserId,
                                                "reportedUserId" to recipientId,
                                                "reportedUsername" to liveRecipientName,
                                                "type" to "dm_chat",
                                                "chatId" to chatId,
                                                "reason" to "Inappropriate behavior",
                                                "timestamp" to FieldValue.serverTimestamp()
                                            )
                                            firestore.collection("reports").add(reportData)
                                        } catch (_: Exception) {}
                                    }
                                },
                                leadingIcon = { Icon(Icons.Default.Shield, null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp)) }
                            )
                            // Block / Unblock User
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        if (isBlocked) "Unblock User" else "Block User",
                                        color = if (isBlocked) Color(0xFF22C55E) else Color(0xFFEF4444),
                                        fontSize = 14.sp
                                    )
                                },
                                onClick = {
                                    showActions = false
                                    scope.launch {
                                        val myUserRef = firestore.collection("users").document(currentUserId)
                                        val myProfileRef = firestore.collection("users").document(currentUserId)
                                            .collection("profile").document(currentUserId)
                                        if (isBlocked) {
                                            myUserRef.update("blockedUsers", FieldValue.arrayRemove(recipientId)).await()
                                            myProfileRef.update("blockedUsers", FieldValue.arrayRemove(recipientId)).await()
                                            isBlocked = false
                                        } else {
                                            myUserRef.update("blockedUsers", FieldValue.arrayUnion(recipientId)).await()
                                            myProfileRef.update("blockedUsers", FieldValue.arrayUnion(recipientId)).await()
                                            isBlocked = true
                                        }
                                    }
                                },
                                leadingIcon = { Icon(Icons.Default.Shield, null, tint = if (isBlocked) Color(0xFF22C55E) else Color(0xFFEF4444), modifier = Modifier.size(18.dp)) }
                            )
                            // Last Seen toggle
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        scope.launch {
                                            val newVal = !showLastSeenSetting
                                            val myUserRef = firestore.collection("users").document(currentUserId)
                                            val myProfileRef = firestore.collection("users").document(currentUserId)
                                                .collection("profile").document(currentUserId)
                                            myUserRef.update("showLastSeen", newVal)
                                            myProfileRef.update("showLastSeen", newVal)
                                            showLastSeenSetting = newVal
                                        }
                                    }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Last Seen", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
                                // Toggle switch matching RN
                                Box(
                                    modifier = Modifier
                                        .size(width = 44.dp, height = 24.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (showLastSeenSetting) Color(0xFF0D9488) else Color(0xFFCBD5E1)),
                                    contentAlignment = if (showLastSeenSetting) Alignment.CenterEnd else Alignment.CenterStart
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .padding(2.dp)
                                            .size(20.dp)
                                            .clip(CircleShape)
                                            .background(Color.White)
                                    )
                                }
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            },
            bottomBar = {
                // ── Edit mode banner ──
                if (editingMessage != null) {
                    Surface(
                        color = Color(0xFFF0F9FF),
                        tonalElevation = 1.dp,
                        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Edit, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Editing message", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                Text(editingMessage?.text ?: "", fontSize = 11.sp, color = Color(0xFF64748B), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            IconButton(onClick = { editingMessage = null; inputText = "" }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, null, tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }

                // ── Blocked state ──
                if (isBlocked) {
                    Surface(color = Color(0xFFF8FAFC), tonalElevation = 2.dp) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text("You blocked this user", fontSize = 14.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Medium)
                        }
                    }
                }

                // ── Input Bar (hidden when editing or blocked) ──
                if (!isBlocked && editingMessage == null) {
                Surface(
                    color = Color.White,
                    tonalElevation = 4.dp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .imePadding()
                ) {
                    Column {
                        // Emoji picker
                        AnimatedVisibility(visible = showEmojiPicker) {
                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(160.dp)
                                    .background(Color(0xFFF8FAFC))
                                    .padding(8.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                items(QUICK_EMOJIS.chunked(8)) { row ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceEvenly
                                    ) {
                                        row.forEach { emoji ->
                                            Text(
                                                emoji,
                                                fontSize = 28.sp,
                                                modifier = Modifier
                                                    .clickable { inputText += emoji }
                                                    .padding(4.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Gift button (amber bg like RN)
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFFF7ED))
                                    .clickable { showGiftPicker = true },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("\uD83C\uDF81", fontSize = 18.sp)
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            // Mic button (for voice recording)
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F9))
                                    .clickable { /* TODO: voice recording */ },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Mic, "Mic", tint = Color(0xFF64748B), modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            // Text input (rounded-full like RN)
                            OutlinedTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                placeholder = { Text("Type something...", color = Color(0xFF94A3B8), fontSize = 14.sp) },
                                modifier = Modifier.weight(1f).padding(horizontal = 4.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = Color(0xFFF1F5F9),
                                    unfocusedContainerColor = Color(0xFFF1F5F9),
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent
                                ),
                                maxLines = 4,
                                textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, color = Color(0xFF1E293B))
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            // Emoji button
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F9))
                                    .clickable { showEmojiPicker = !showEmojiPicker },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.EmojiEmotions,
                                    "Emoji",
                                    tint = if (showEmojiPicker) Color(0xFF8B5CF6) else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            // Send/Plus button — Plus when empty, Send when text, cyan like RN
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F9))
                                    .clickable {
                                        if (inputText.trim().isNotBlank()) {
                                            sendTextMessage()
                                        } else {
                                            imagePickerLauncher.launch("image/*")
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                if (isUploading) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = Color(0xFF06B6D4))
                                } else if (inputText.trim().isNotBlank()) {
                                    Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Color(0xFF06B6D4), modifier = Modifier.size(18.dp))
                                } else {
                                    Icon(Icons.Default.Add, "Attach", tint = Color(0xFF64748B), modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
            }
        ) { paddingValues ->
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(Color(0xFFF8FAFC)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    val isMe = msg.senderId == currentUserId
                    MessageBubble(
                        message = msg,
                        isMe = isMe,
                        myAvatar = myAvatar,
                        recipientAvatar = liveRecipientAvatar,
                        onLongClick = {
                            if (isMe) {
                                selectedMessage = msg
                            }
                        }
                    )
                }
            }
        }
    }

    // ── Message Options Dialog (Long press) ──
    if (selectedMessage != null) {
        AlertDialog(
            onDismissRequest = { selectedMessage = null },
            containerColor = Color.White,
            shape = RoundedCornerShape(20.dp),
            title = { Text("Message Options", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    if (selectedMessage?.type == "text") {
                        TextButton(onClick = {
                            editingMessage = selectedMessage
                            inputText = selectedMessage?.text ?: ""
                            selectedMessage = null
                        }) {
                            Text("Edit", modifier = Modifier.fillMaxWidth(), color = Color(0xFF1E293B))
                        }
                    }
                    TextButton(onClick = { showDeleteDialog = true }) {
                        Text("Delete", modifier = Modifier.fillMaxWidth(), color = Color(0xFFEF4444))
                    }
                }
            },
            confirmButton = {},
            dismissButton = {}
        )
    }

    // ── Delete Confirmation ──
    if (showDeleteDialog && selectedMessage != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(20.dp),
            title = { Text("Delete Message?") },
            text = { Text("This action cannot be undone.") },
            confirmButton = {
                TextButton(onClick = { deleteMessage(selectedMessage!!) }) {
                    Text("Delete", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel", color = Color(0xFF64748B))
                }
            }
        )
    }

    // ── Gift Picker Modal ──
    if (showGiftPicker) {
        GiftPickerSheet(
            recipientCoins = recipientCoins,
            onDismiss = { showGiftPicker = false },
            onSendGift = { giftName, amount ->
                scope.launch {
                    val messageMap = hashMapOf(
                        "senderId" to currentUserId,
                        "timestamp" to FieldValue.serverTimestamp(),
                        "isGift" to true,
                        "giftName" to giftName,
                        "coinAmount" to amount,
                        "isRead" to false,
                        "type" to "gift"
                    )
                    firestore.collection("privateChats").document(chatId)
                        .collection("messages").add(messageMap).await()

                    // Deduct coins from sender, add to recipient
                    val senderRef = firestore.collection("users").document(currentUserId)
                    val recipientRef = firestore.collection("users").document(recipientId)
                    firestore.runTransaction { tx ->
                        val senderSnap = tx.get(senderRef)
                        val senderCoins = (senderSnap.getLong("coins") ?: 0L).toInt()
                        if (senderCoins >= amount) {
                            tx.update(senderRef, "coins", (senderCoins - amount).toLong())
                            tx.update(recipientRef, "coins", FieldValue.increment(amount.toLong()))
                            true
                        } else false
                    }.await()

                    firestore.collection("privateChats").document(chatId).update(
                        mapOf(
                            "lastMessage" to "🎁 $giftName",
                            "lastSenderId" to currentUserId,
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    )
                }
                showGiftPicker = false
            }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(
    message: ChatMessage,
    isMe: Boolean,
    myAvatar: String = "",
    recipientAvatar: String = "",
    onLongClick: () -> Unit
) {
    val formatter = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    val timeString = if (message.timestamp > 0) formatter.format(Date(message.timestamp)) else ""
    val avatarUrl = if (isMe) myAvatar else recipientAvatar

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        // Recipient avatar on LEFT (28dp like RN)
        if (!isMe) {
            AsyncImage(
                model = (CdnUtils.toCdn(recipientAvatar) ?: "").ifBlank { "https://picsum.photos/100" },
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE2E8F0))
            )
            Spacer(modifier = Modifier.width(6.dp))
        }

        Column(
            horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
            modifier = Modifier.widthIn(max = 260.dp)
        ) {
            // Room invite
            if (message.roomInvite != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(listOf(Color(0xFF06B6D4), Color(0xFF0891B2)))
                        )
                        .padding(12.dp)
                ) {
                    Column {
                        Text("🎤 Room Invite", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(message.roomInvite.roomName, color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp)
                        Text("by ${message.roomInvite.hostName}", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.2f))
                                .clickable { /* Join room */ }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Join Now", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
            // Image message
            else if (message.imageUrl != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .combinedClickable(onClick = {}, onLongClick = onLongClick)
                ) {
                    AsyncImage(
                        model = CdnUtils.toCdn(message.imageUrl),
                        contentDescription = "Image",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .widthIn(max = 220.dp)
                            .heightIn(min = 120.dp, max = 260.dp)
                            .clip(RoundedCornerShape(16.dp))
                    )
                }
            }
            // Gift message — RN: centered layout, gift image, "Tap to view"
            else if (message.isGift) {
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(listOf(Color(0xFFEC4899), Color(0xFF9333EA)))
                        )
                        .combinedClickable(onClick = {}, onLongClick = onLongClick)
                        .padding(12.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        if (message.imageUrl != null) {
                            AsyncImage(
                                model = CdnUtils.toCdn(message.imageUrl),
                                contentDescription = null,
                                contentScale = ContentScale.Fit,
                                modifier = Modifier.size(80.dp)
                            )
                        } else {
                            Text("\uD83C\uDF81", fontSize = 40.sp)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            message.giftName ?: "Gift",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 11.sp
                        )
                        Text(
                            "Tap to view",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 9.sp
                        )
                        if (timeString.isNotBlank()) {
                            Text(timeString, fontSize = 8.sp, color = Color.White.copy(alpha = 0.6f), fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }
            // Voice message
            else if (message.voiceUrl != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            if (isMe) Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))
                            else Brush.linearGradient(listOf(Color(0xFFF1F5F9), Color(0xFFF1F5F9)))
                        )
                        .combinedClickable(onClick = {}, onLongClick = onLongClick)
                        .padding(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.width(160.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(if (isMe) Color.White.copy(alpha = 0.2f) else Color(0xFFE2E8F0)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.PlayArrow, null, tint = if (isMe) Color.White else Color(0xFF64748B), modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "${message.duration}s",
                            color = if (isMe) Color.White else Color(0xFF64748B),
                            fontSize = 12.sp
                        )
                    }
                }
            }
            // Text message — RN parity: cyan-500 sender, slate-100 receiver
            else {
                Box(
                    modifier = Modifier
                        .clip(
                            RoundedCornerShape(
                                topStart = 16.dp, topEnd = 16.dp,
                                bottomStart = if (isMe) 16.dp else 4.dp,
                                bottomEnd = if (isMe) 4.dp else 16.dp
                            )
                        )
                        .background(if (isMe) Color(0xFF06B6D4) else Color(0xFFF1F5F9))
                        .combinedClickable(onClick = {}, onLongClick = onLongClick)
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    Column {
                        Text(
                            message.text ?: "",
                            color = if (isMe) Color.White else Color(0xFF1E293B),
                            fontSize = 14.sp
                        )
                        if (message.isEdited) {
                            Text(
                                "edited",
                                color = if (isMe) Color.White.copy(alpha = 0.6f) else Color(0xFF94A3B8),
                                fontSize = 10.sp,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                            )
                        }
                    }
                }
            }

            // Time + read receipt
            Row(
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 2.dp, start = 4.dp, end = 4.dp)
            ) {
                Text(timeString, fontSize = 10.sp, color = Color(0xFF94A3B8))
                if (isMe) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.Default.Check,
                        "Read",
                        tint = if (message.isRead) Color(0xFF22C55E) else Color(0xFF94A3B8),
                        modifier = Modifier.size(12.dp)
                    )
                }
            }
        }

        // My avatar on RIGHT (28dp like RN)
        if (isMe) {
            Spacer(modifier = Modifier.width(6.dp))
            AsyncImage(
                model = (CdnUtils.toCdn(avatarUrl) ?: "").ifBlank { "https://picsum.photos/100" },
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE2E8F0))
            )
        }
    }
}

@Composable
fun GiftPickerSheet(
    recipientCoins: Int,
    onDismiss: () -> Unit,
    onSendGift: (String, Int) -> Unit
) {
    var selectedGift by remember { mutableStateOf<String?>(null) }
    var selectedAmount by remember { mutableIntStateOf(0) }
    var showAmountDialog by remember { mutableStateOf(false) }

    val gifts = listOf(
        "\uD83C\uDF81" to "Gift Box",
        "\uD83D\uDC8E" to "Diamond",
        "\uD83C\uDF53" to "Strawberry",
        "\uD83C\uDF6D" to "Lollipop",
        "\u2B50" to "Star",
        "\uD83D\uDD25" to "Fire",
        "\uD83C\uDF39" to "Rose",
        "\uD83C\uDF82" to "Cake",
        "\uD83C\uDFC6" to "Trophy",
        "\uD83D\uDE80" to "Rocket",
        "\uD83D\uDCA5" to "Boom",
        "\uD83C\uDF1F" to "Sparkle"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Send a Gift", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    "Your balance: $recipientCoins coins",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(top = 4.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))

                // Gift grid
                androidx.compose.foundation.lazy.grid.LazyVerticalGrid(
                    columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(4),
                    modifier = Modifier.height(200.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(gifts.size) { index ->
                        val (emoji, name) = gifts[index]
                        val isSelected = selectedGift == name
                        Box(
                            modifier = Modifier
                                .aspectRatio(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isSelected) Color(0xFFEEF2FF) else Color(0xFFF8FAFC)
                                )
                                .then(
                                    if (isSelected) Modifier.border(2.dp, Color(0xFF6366F1), RoundedCornerShape(12.dp))
                                    else Modifier
                                )
                                .clickable {
                                    selectedGift = name
                                    selectedAmount = 0
                                    showAmountDialog = true
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(emoji, fontSize = 28.sp)
                                Text(name, fontSize = 9.sp, color = Color(0xFF64748B), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Close button
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Close", color = Color(0xFF64748B))
                }
            }
        }
    }

    // ── Amount picker dialog ──
    if (showAmountDialog && selectedGift != null) {
        var amountInput by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAmountDialog = false; selectedGift = null },
            containerColor = Color.White,
            shape = RoundedCornerShape(20.dp),
            title = { Text("Enter Amount", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("How many coins to send?", color = Color(0xFF64748B), fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = amountInput,
                        onValueChange = { amountInput = it.filter { c -> c.isDigit() } },
                        placeholder = { Text("0") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFFF8FAFC),
                            unfocusedContainerColor = Color(0xFFF8FAFC)
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("1", "10", "100", "1000").forEach { amt ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF1F5F9))
                                    .clickable { amountInput = amt }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(amt, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val amt = amountInput.toIntOrNull() ?: 0
                        if (amt > 0) {
                            onSendGift(selectedGift!!, amt)
                            showAmountDialog = false
                            selectedGift = null
                        }
                    }
                ) {
                    Text("Send", fontWeight = FontWeight.Bold, color = Color(0xFF6366F1))
                }
            },
            dismissButton = {
                TextButton(onClick = { showAmountDialog = false; selectedGift = null }) {
                    Text("Cancel", color = Color(0xFF64748B))
                }
            }
        )
    }
}

private fun formatLastSeen(timestamp: com.google.firebase.Timestamp?): String {
    if (timestamp == null) return "offline"
    val date = timestamp.toDate()
    val now = java.util.Calendar.getInstance()
    val lastSeenCal = java.util.Calendar.getInstance().apply { time = date }

    val isSameDay = now.get(java.util.Calendar.YEAR) == lastSeenCal.get(java.util.Calendar.YEAR) &&
            now.get(java.util.Calendar.DAY_OF_YEAR) == lastSeenCal.get(java.util.Calendar.DAY_OF_YEAR)

    val isYesterday = now.get(java.util.Calendar.YEAR) == lastSeenCal.get(java.util.Calendar.YEAR) &&
            now.get(java.util.Calendar.DAY_OF_YEAR) - lastSeenCal.get(java.util.Calendar.DAY_OF_YEAR) == 1

    val fmt = java.text.SimpleDateFormat("h:mm a", java.util.Locale.getDefault())
    val timeStr = fmt.format(date)

    return when {
        isSameDay -> "last seen today at $timeStr"
        isYesterday -> "last seen yesterday at $timeStr"
        else -> {
            val dateFmt = java.text.SimpleDateFormat("MMM d, yyyy", java.util.Locale.getDefault())
            "last seen on ${dateFmt.format(date)}"
        }
    }
}


