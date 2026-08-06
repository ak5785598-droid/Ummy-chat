package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// RoomMessagesDialog — mirrors RN room-messages-dialog.tsx
// 2 views: Chat Inbox List + Active Conversation View
// ─────────────────────────────────────────────────────────────────────────────

data class RoomChatPreview(
    val id: String,
    val participantIds: List<String>,
    val otherUserUid: String,
    val otherUserName: String,
    val otherUserAvatar: String?,
    val lastMessage: String,
    val lastSenderId: String,
    val unread: Int = 0
)

data class RoomPrivateMessage(
    val id: String,
    val text: String,
    val senderId: String,
    val type: String = "text", // "text" | "room_invite"
    val roomId: String? = null,
    val roomName: String? = null,
    val roomNumber: String? = null,
    val roomCoverUrl: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomMessagesDialog(
    visible: Boolean,
    roomId: String,
    initialRecipient: Triple<String, String, String?>? = null, // uid, name, avatarUrl
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    val currentUid = Firebase.auth.currentUser?.uid ?: return

    var chats by remember { mutableStateOf<List<RoomChatPreview>>(emptyList()) }
    var selectedChat by remember { mutableStateOf<RoomChatPreview?>(null) }
    var messages by remember { mutableStateOf<List<RoomPrivateMessage>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }

    // Fetch private chats list
    LaunchedEffect(currentUid) {
        try {
            val db = Firebase.firestore
            val snap = db.collection("privateChats")
                .whereArrayContains("participantIds", currentUid)
                .get().await()

            val chatList = snap.documents.map { doc ->
                val parts = doc.get("participantIds") as? List<String> ?: emptyList()
                val otherUid = parts.firstOrNull { it != currentUid } ?: ""
                var otherName = "User"
                var otherAvatar: String? = null

                if (otherUid.isNotBlank()) {
                    val userDoc = db.collection("users").document(otherUid).get().await()
                    otherName = userDoc.getString("username") ?: "User"
                    otherAvatar = userDoc.getString("avatarUrl")
                }

                RoomChatPreview(
                    id = doc.id,
                    participantIds = parts,
                    otherUserUid = otherUid,
                    otherUserName = otherName,
                    otherUserAvatar = otherAvatar,
                    lastMessage = doc.getString("lastMessage") ?: "",
                    lastSenderId = doc.getString("lastSenderId") ?: ""
                )
            }
            chats = chatList

            // If initialRecipient provided, select/create chat
            if (initialRecipient != null) {
                val existing = chatList.find { it.otherUserUid == initialRecipient.first }
                if (existing != null) {
                    selectedChat = existing
                } else {
                    val newChatId = listOf(currentUid, initialRecipient.first).sorted().joinToString("_")
                    selectedChat = RoomChatPreview(
                        id = newChatId,
                        participantIds = listOf(currentUid, initialRecipient.first),
                        otherUserUid = initialRecipient.first,
                        otherUserName = initialRecipient.second,
                        otherUserAvatar = initialRecipient.third,
                        lastMessage = "",
                        lastSenderId = ""
                    )
                }
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    // Fetch active conversation messages
    LaunchedEffect(selectedChat?.id) {
        val chatId = selectedChat?.id ?: return@LaunchedEffect
        try {
            val db = Firebase.firestore
            val snap = db.collection("privateChats").document(chatId)
                .collection("messages")
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.ASCENDING)
                .get().await()

            messages = snap.documents.map { doc ->
                RoomPrivateMessage(
                    id = doc.id,
                    text = doc.getString("text") ?: "",
                    senderId = doc.getString("senderId") ?: "",
                    type = doc.getString("type") ?: "text",
                    roomId = doc.getString("roomId"),
                    roomName = doc.getString("roomName"),
                    roomNumber = doc.getString("roomNumber"),
                    roomCoverUrl = doc.getString("roomCoverUrl")
                )
            }
        } catch (_: Exception) {}
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color.White,
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (selectedChat != null) {
                    IconButton(onClick = { selectedChat = null }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color(0xFF1E293B))
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        selectedChat?.otherUserName ?: "Messages",
                        color = Color(0xFF1E293B),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Message, contentDescription = null, tint = Color(0xFF8B5CF6))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Messages",
                            color = Color(0xFF1E293B),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF1F5F9))
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            if (selectedChat == null) {
                // ── Inbox View ────────────────────────────────────────────────
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF8B5CF6))
                    }
                } else if (chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No messages yet", color = Color(0xFF94A3B8), fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(chats, key = { it.id }) { chat ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedChat = chat }
                                    .padding(horizontal = 20.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = chat.otherUserAvatar ?: "https://picsum.photos/200",
                                    contentDescription = chat.otherUserName,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.size(48.dp).clip(CircleShape)
                                )
                                Spacer(Modifier.width(14.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        chat.otherUserName,
                                        color = Color(0xFF1E293B),
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.height(2.dp))
                                    Text(
                                        chat.lastMessage.ifBlank { "Tap to start conversation" },
                                        color = Color(0xFF64748B),
                                        fontSize = 13.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(start = 82.dp))
                        }
                    }
                }
            } else {
                // ── Active Chat View ─────────────────────────────────────────
                val listState = rememberLazyListState()
                LaunchedEffect(messages.size) {
                    if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
                }

                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(messages, key = { it.id }) { msg ->
                            val isMe = msg.senderId == currentUid
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                            ) {
                                if (msg.type == "room_invite") {
                                    // Room Invite Card
                                    Card(
                                        modifier = Modifier.width(220.dp),
                                        shape = RoundedCornerShape(16.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("🎙️ Room Invite", color = Color(0xFF60A5FA), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            Spacer(Modifier.height(4.dp))
                                            Text(msg.roomName ?: "Room", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                            Text("#${msg.roomNumber}", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                                        }
                                    }
                                } else {
                                    // Text Bubble
                                    Box(
                                        modifier = Modifier
                                            .clip(
                                                RoundedCornerShape(
                                                    topStart = 16.dp, topEnd = 16.dp,
                                                    bottomStart = if (isMe) 16.dp else 4.dp,
                                                    bottomEnd = if (isMe) 4.dp else 16.dp
                                                )
                                            )
                                            .background(
                                                if (isMe) Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFF6366F1)))
                                                else Brush.linearGradient(listOf(Color(0xFFF1F5F9), Color(0xFFF1F5F9)))
                                            )
                                            .padding(horizontal = 14.dp, vertical = 10.dp)
                                    ) {
                                        Text(
                                            msg.text,
                                            color = if (isMe) Color.White else Color(0xFF0F172A),
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Chat Input Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF8FAFC))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        modifier = Modifier.weight(1f).height(46.dp),
                        placeholder = { Text("Type a message...", color = Color(0xFF94A3B8), fontSize = 13.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                            focusedBorderColor = Color(0xFF8B5CF6),
                            unfocusedBorderColor = Color(0xFFE2E8F0)
                        ),
                        shape = RoundedCornerShape(24.dp),
                        singleLine = true
                    )
                    Spacer(Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            val textToSend = inputText.trim()
                            val chatId = selectedChat?.id ?: return@IconButton
                            if (textToSend.isBlank()) return@IconButton
                            inputText = ""

                            scope.launch {
                                try {
                                    val db = Firebase.firestore
                                    db.collection("privateChats").document(chatId)
                                        .collection("messages").add(
                                            mapOf(
                                                "text" to textToSend,
                                                "senderId" to currentUid,
                                                "timestamp" to FieldValue.serverTimestamp()
                                            )
                                        ).await()

                                    db.collection("privateChats").document(chatId).set(
                                        mapOf(
                                            "participantIds" to listOf(currentUid, selectedChat!!.otherUserUid).sorted(),
                                            "lastMessage" to textToSend,
                                            "lastSenderId" to currentUid,
                                            "updatedAt" to FieldValue.serverTimestamp()
                                        ),
                                        com.google.firebase.firestore.SetOptions.merge()
                                    ).await()
                                } catch (_: Exception) {}
                            }
                        },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))))
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}
