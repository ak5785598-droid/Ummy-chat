package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// RoomShareSheet — mirrors RN room-share-sheet.tsx
// Bottom sheet to share room invite to followers/following via in-app DM,
// or copy Room ID / Link to clipboard
// ─────────────────────────────────────────────────────────────────────────────

data class ShareContact(
    val uid: String,
    val username: String,
    val avatarUrl: String?
)

data class ShareRoom(
    val id: String,
    val title: String,
    val roomNumber: String,
    val coverUrl: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomShareSheet(
    room: ShareRoom?,
    onDismiss: () -> Unit,
    onShare: (() -> Unit)? = null
) {
    if (room == null) return

    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    var searchQuery by remember { mutableStateOf(TextFieldValue("")) }
    var contacts by remember { mutableStateOf<List<ShareContact>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var sendingStatus by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var copiedId by remember { mutableStateOf(false) }
    var copiedLink by remember { mutableStateOf(false) }

    val roomUrl = "https://ummy-chat.vercel.app/rooms/${room.id}"
    val currentUid = Firebase.auth.currentUser?.uid

    // Load followers + following contacts
    LaunchedEffect(Unit) {
        if (currentUid == null) { isLoading = false; return@LaunchedEffect }
        try {
            val db = Firebase.firestore
            val followersSnap = db.collection("followers")
                .whereEqualTo("followingId", currentUid).get().await()
            val followingSnap = db.collection("followers")
                .whereEqualTo("followerId", currentUid).get().await()

            val uidSet = mutableSetOf<String>()
            followersSnap.documents.forEach { it.getString("followerId")?.let { id -> if (id != currentUid) uidSet.add(id) } }
            followingSnap.documents.forEach { it.getString("followingId")?.let { id -> if (id != currentUid) uidSet.add(id) } }

            val contactList = uidSet.map { uid ->
                try {
                    val doc = db.collection("users").document(uid).get().await()
                    ShareContact(
                        uid = uid,
                        username = doc.getString("username") ?: "User",
                        avatarUrl = doc.getString("avatarUrl")
                    )
                } catch (_: Exception) {
                    ShareContact(uid = uid, username = "User", avatarUrl = null)
                }
            }
            contacts = contactList
        } catch (_: Exception) {}
        isLoading = false
    }

    val filtered = remember(contacts, searchQuery.text) {
        if (searchQuery.text.isBlank()) contacts
        else contacts.filter { it.username.contains(searchQuery.text, ignoreCase = true) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f)
        ) {
            // ── Header ────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
                    .border(
                        width = 0.dp,
                        color = Color.Transparent,
                        shape = RoundedCornerShape(0.dp)
                    ),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Share, contentDescription = null,
                        tint = Color(0xFF60A5FA), modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "SHARE ROOM",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp,
                        letterSpacing = 1.sp
                    )
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))

            // ── Search bar ────────────────────────────────────────────────
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp)
                    .height(46.dp),
                placeholder = {
                    Text(
                        "Search Friends / Followers...",
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 13.sp
                    )
                },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null,
                        tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color.White.copy(alpha = 0.15f),
                    unfocusedBorderColor = Color.White.copy(alpha = 0.08f),
                    cursorColor = Color(0xFF60A5FA),
                    focusedContainerColor = Color.White.copy(alpha = 0.05f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.05f)
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            // ── Contact list ──────────────────────────────────────────────
            Box(modifier = Modifier.weight(1f).padding(horizontal = 16.dp)) {
                when {
                    isLoading -> {
                        CircularProgressIndicator(
                            color = Color(0xFF60A5FA),
                            modifier = Modifier.align(Alignment.Center).size(24.dp),
                            strokeWidth = 2.dp
                        )
                    }
                    filtered.isEmpty() -> {
                        Text(
                            "No friends or followers found",
                            color = Color.White.copy(alpha = 0.4f),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    else -> {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(0.dp)) {
                            items(filtered, key = { it.uid }) { contact ->
                                val status = sendingStatus[contact.uid] ?: "idle"
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 10.dp)
                                        .border(
                                            width = 0.dp,
                                            color = Color.Transparent,
                                            shape = RoundedCornerShape(0.dp)
                                        ),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Avatar
                                    if (contact.avatarUrl != null) {
                                        AsyncImage(
                                            model = contact.avatarUrl,
                                            contentDescription = contact.username,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.size(40.dp).clip(CircleShape)
                                                .background(Color.White.copy(alpha = 0.05f))
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier.size(40.dp).clip(CircleShape)
                                                .background(Color(0xFF38BDF8)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                contact.username.firstOrNull()?.uppercase() ?: "U",
                                                color = Color.White, fontWeight = FontWeight.Black,
                                                fontSize = 16.sp
                                            )
                                        }
                                    }

                                    Spacer(Modifier.width(12.dp))
                                    Text(
                                        contact.username,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        modifier = Modifier.weight(1f)
                                    )

                                    // Send button
                                    val btnColor = when (status) {
                                        "sent"    -> Color.White.copy(alpha = 0.05f)
                                        "sending" -> Color(0xFF60A5FA).copy(alpha = 0.2f)
                                        else      -> Color(0xFF60A5FA)
                                    }
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(btnColor)
                                            .clickable(enabled = status == "idle") {
                                                if (currentUid == null) return@clickable
                                                sendingStatus = sendingStatus + (contact.uid to "sending")
                                                scope.launch {
                                                    try {
                                                        val db = Firebase.firestore
                                                        val chatId = listOf(currentUid, contact.uid).sorted().joinToString("_")
                                                        val inviteText = "Hey, join my room! 🎙️\nRoom ID: #${room.roomNumber}\nLink: $roomUrl"
                                                        db.collection("privateChats").document(chatId)
                                                            .collection("messages").add(
                                                                mapOf(
                                                                    "text" to inviteText,
                                                                    "senderId" to currentUid,
                                                                    "timestamp" to FieldValue.serverTimestamp(),
                                                                    "type" to "room_invite",
                                                                    "roomId" to room.id,
                                                                    "roomName" to room.title,
                                                                    "roomNumber" to room.roomNumber,
                                                                    "roomCoverUrl" to room.coverUrl
                                                                )
                                                            ).await()
                                                        db.collection("privateChats").document(chatId)
                                                            .set(
                                                                mapOf(
                                                                    "participantIds" to listOf(currentUid, contact.uid).sorted(),
                                                                    "lastMessage" to "🎙️ Room Invite #${room.roomNumber}",
                                                                    "lastSenderId" to currentUid,
                                                                    "lastMessageReadBy" to listOf(currentUid),
                                                                    "updatedAt" to FieldValue.serverTimestamp()
                                                                ),
                                                                SetOptions.merge()
                                                            ).await()
                                                        sendingStatus = sendingStatus + (contact.uid to "sent")
                                                        onShare?.invoke()
                                                    } catch (_: Exception) {
                                                        sendingStatus = sendingStatus + (contact.uid to "idle")
                                                    }
                                                }
                                            }
                                            .padding(horizontal = 14.dp, vertical = 7.dp)
                                    ) {
                                        when (status) {
                                            "sending" -> CircularProgressIndicator(
                                                color = Color(0xFF60A5FA),
                                                modifier = Modifier.size(14.dp),
                                                strokeWidth = 2.dp
                                            )
                                            "sent" -> Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.Check, contentDescription = null,
                                                    tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(12.dp))
                                                Spacer(Modifier.width(4.dp))
                                                Text("SENT", color = Color.White.copy(alpha = 0.4f),
                                                    fontSize = 11.sp, fontWeight = FontWeight.Black)
                                            }
                                            else -> Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.Send, contentDescription = null,
                                                    tint = Color(0xFF0F172A), modifier = Modifier.size(11.dp))
                                                Spacer(Modifier.width(4.dp))
                                                Text("SEND", color = Color(0xFF0F172A),
                                                    fontSize = 11.sp, fontWeight = FontWeight.Black)
                                            }
                                        }
                                    }
                                }
                                HorizontalDivider(color = Color.White.copy(alpha = 0.02f))
                            }
                        }
                    }
                }
            }

            // ── Copy footer ───────────────────────────────────────────────
            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Copy Room ID
                CopyFooterBtn(
                    label = if (copiedId) "Copied ID" else "Copy ID",
                    copied = copiedId,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        clipboard.setText(AnnotatedString(room.roomNumber))
                        copiedId = true
                        scope.launch { kotlinx.coroutines.delay(2000); copiedId = false }
                    }
                )
                // Copy Link
                CopyFooterBtn(
                    label = if (copiedLink) "Copied Link" else "Copy Link",
                    copied = copiedLink,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        clipboard.setText(AnnotatedString(roomUrl))
                        copiedLink = true
                        scope.launch { kotlinx.coroutines.delay(2000); copiedLink = false }
                    }
                )
            }

            Spacer(Modifier.navigationBarsPadding())
        }
    }
}

@Composable
private fun CopyFooterBtn(
    label: String,
    copied: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Row(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White.copy(alpha = 0.05f))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(
            if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
            contentDescription = null,
            tint = if (copied) Color(0xFF60A5FA) else Color.White.copy(alpha = 0.6f),
            modifier = Modifier.size(14.dp)
        )
        Spacer(Modifier.width(6.dp))
        Text(
            label.uppercase(),
            color = if (copied) Color(0xFF60A5FA) else Color.White,
            fontSize = 11.sp, fontWeight = FontWeight.Black
        )
    }
}
