package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.RemoveCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.util.CdnUtils

@Composable
fun EditNameModal(roomId: String, currentName: String = "", onDismiss: () -> Unit) {
    var title by remember { mutableStateOf(currentName) }
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Room Title") },
        text = {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Room Title") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        isLoading = true
                        scope.launch {
                            try {
                                FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                    .update(mapOf("title" to title.trim(), "name" to title.trim())).await()
                                onDismiss()
                            } catch (e: Exception) {
                                e.printStackTrace()
                            } finally {
                                isLoading = false
                            }
                        }
                    }
                },
                enabled = !isLoading
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) { Text("Cancel") }
        }
    )
}

@Composable
fun EditAnnouncementModal(roomId: String, currentAnnouncement: String = "", onDismiss: () -> Unit) {
    var announcement by remember { mutableStateOf(currentAnnouncement) }
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Room Announcement") },
        text = {
            OutlinedTextField(
                value = announcement,
                onValueChange = { announcement = it },
                label = { Text("Announcement") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                maxLines = 5
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    isLoading = true
                    scope.launch {
                        try {
                            FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                .update("announcement", announcement.trim()).await()
                            onDismiss()
                        } catch (e: Exception) {
                            e.printStackTrace()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                enabled = !isLoading
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) { Text("Cancel") }
        }
    )
}

@Composable
fun MicTestModal(onDismiss: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "mic_meter")
    val meterScale by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "meter_scale"
    )

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Mic Test",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(32.dp))
                
                Box(
                    modifier = Modifier.size(100.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(100.dp * meterScale)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                    )
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "Recording indicator...", color = MaterialTheme.colorScheme.onSurfaceVariant)
                
                Spacer(modifier = Modifier.height(32.dp))
                Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text("Close")
                }
            }
        }
    }
}

@Composable
fun MicCountModal(roomId: String, currentSeats: Int = 6, onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }
    
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF1E293B),
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF00E6A5))
                    }
                } else {
                    AmountOfMicSelector(
                        selectedCount = currentSeats,
                        onSelect = { seats ->
                            isLoading = true
                            scope.launch {
                                try {
                                    FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                        .update(
                                            mapOf(
                                                "maxSeats" to seats,
                                                "maxActiveMics" to seats,
                                                "seatsCount" to seats
                                            )
                                        ).await()
                                    onDismiss()
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                } finally {
                                    isLoading = false
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun PasswordModal(roomId: String, onDismiss: () -> Unit) {
    var password by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Room Password") },
        text = {
            Column {
                OutlinedTextField(
                    value = password,
                    onValueChange = { if (it.length <= 4) password = it },
                    label = { Text("4-Digit PIN") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (password.length == 4) {
                        isLoading = true
                        scope.launch {
                            try {
                                FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                    .update(
                                        mapOf(
                                            "password" to password,
                                            "isLocked" to true
                                        )
                                    ).await()
                                onDismiss()
                            } catch (e: Exception) {
                                e.printStackTrace()
                            } finally {
                                isLoading = false
                            }
                        }
                    }
                },
                enabled = password.length == 4 && !isLoading
            ) {
                Text("Set Password")
            }
        },
        dismissButton = {
            TextButton(
                onClick = {
                    isLoading = true
                    scope.launch {
                        try {
                            FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                .update(
                                    mapOf(
                                        "password" to FieldValue.delete(),
                                        "isLocked" to false
                                    )
                                ).await()
                            onDismiss()
                        } catch (e: Exception) {
                            e.printStackTrace()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                enabled = !isLoading
            ) {
                Text("Remove")
            }
        }
    )
}

@Composable
fun RoomTagModal(roomId: String, currentTag: String = "Chat", onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    val tags = listOf(
        "Chat" to "💬",
        "Game" to "🎮",
        "Music" to "🎵",
        "Party" to "🎉"
    )

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "Room Category",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                tags.forEach { (tag, emoji) ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                            .clickable(enabled = !isLoading) {
                                isLoading = true
                                scope.launch {
                                    try {
                                        FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                            .update("category", tag).await()
                                        onDismiss()
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = if (currentTag == tag) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = emoji, fontSize = 24.sp, modifier = Modifier.padding(end = 16.dp))
                            Text(
                                text = tag,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = if (currentTag == tag) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                TextButton(onClick = onDismiss, modifier = Modifier.align(Alignment.End), enabled = !isLoading) {
                    Text("Cancel")
                }
            }
        }
    }
}

@Composable
fun RoomAdminModal(
    roomId: String,
    initialAdmins: List<String> = emptyList(),
    participants: List<app.vercel.ummy_chat.twa.data.model.RoomParticipant> = emptyList(),
    ownerId: String = "",
    currentUid: String = "",
    onDismiss: () -> Unit
) {
    var admins by remember { mutableStateOf(initialAdmins) }
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }

    // RN admin limit logic: base 3 + floor(roomLevel/5) + SVIP bonus
    // For now use defaults since roomLevel/SVIP aren't passed
    val maxAdmins = 20 // generous default

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            tonalElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 480.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Administrators",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Admin Limit: ${admins.size} / $maxAdmins slots",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF7C3AED)
                )
                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(participants) { participant ->
                        val isOwner = participant.uid == ownerId
                        val isMod = admins.contains(participant.uid)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AsyncImage(
                                model = CdnUtils.toCdn(participant.avatarUrl ?: "https://picsum.photos/100"),
                                contentDescription = null,
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE2E8F0)),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = participant.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF111827),
                                modifier = Modifier.weight(1f)
                            )
                            if (isOwner) {
                                Text(
                                    text = "OWNER",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color(0xFFD97706),
                                    letterSpacing = 1.sp
                                )
                            } else {
                                Switch(
                                    checked = isMod,
                                    onCheckedChange = { checked ->
                                        isLoading = true
                                        scope.launch {
                                            try {
                                                val field = if (checked) "moderatorIds" else "moderatorIds"
                                                val update = if (checked) {
                                                    mapOf("moderatorIds" to FieldValue.arrayUnion(participant.uid))
                                                } else {
                                                    mapOf("moderatorIds" to FieldValue.arrayRemove(participant.uid))
                                                }
                                                FirebaseFirestore.getInstance().collection("chatRooms").document(roomId)
                                                    .update(update).await()
                                                admins = if (checked) admins + participant.uid else admins - participant.uid
                                            } catch (e: Exception) {
                                                e.printStackTrace()
                                            } finally {
                                                isLoading = false
                                            }
                                        }
                                    },
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = Color(0xFFC084FC),
                                        checkedTrackColor = Color(0xFF9333EA),
                                        uncheckedThumbColor = Color(0xFF9CA3AF),
                                        uncheckedTrackColor = Color(0xFFE2E8F0)
                                    )
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                ) {
                    Text("Close", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun RoomLogsModal(roomId: String, onDismiss: () -> Unit) {
    val scope = rememberCoroutineScope()
    var activeTab by remember { mutableIntStateOf(0) } // 0=Entries, 1=Kicks, 2=Bans
    var logs by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var bans by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    // Listen to entryLogs subcollection
    DisposableEffect(roomId) {
        val logCol = FirebaseFirestore.getInstance().collection("chatRooms").document(roomId).collection("entryLogs")
        val logReg = logCol.addSnapshotListener { snap, _ ->
            logs = snap?.documents?.mapNotNull { it.data } ?: emptyList()
            loading = false
        }
        val banCol = FirebaseFirestore.getInstance().collection("chatRooms").document(roomId).collection("bans")
        val banReg = banCol.addSnapshotListener { snap, _ ->
            bans = snap?.documents?.mapNotNull { d ->
                val data = d.data?.toMutableMap() ?: mutableMapOf()
                data["id"] = d.id
                data
            } ?: emptyList()
        }
        onDispose { logReg.remove(); banReg.remove() }
    }

    fun handleUnban(userId: String) {
        scope.launch {
            try {
                val fs = FirebaseFirestore.getInstance()
                fs.collection("chatRooms").document(roomId).collection("bans").document(userId).delete().await()
                try {
                    fs.collection("chatRooms").document(roomId).collection("participants").document(userId)
                        .update("kickedUntil", null).await()
                } catch (_: Exception) {}
                bans = bans.filter { (it["id"] ?: it["bannedUid"]) != userId }
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    val filteredLogs = remember(logs, activeTab) {
        when (activeTab) {
            0 -> logs.filter { it["type"] == "entry" || it["type"] == null }
            1 -> logs.filter { it["type"] == "kick" || it["type"] == "ban" || it["durationMs"] != null }
            else -> emptyList()
        }
    }

    val entryCount = remember(logs) { logs.count { it["type"] == "entry" } }
    val kickCount = remember(logs) { logs.count { it["type"] == "kick" } }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 500.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Room Logs & Ban Center", fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color(0xFF111827))
                Spacer(modifier = Modifier.height(12.dp))

                // 3 Tab Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFF3F4F6))
                        .padding(3.dp)
                ) {
                    val tabs = listOf("Entries ($entryCount)", "Kicks ($kickCount)", "Bans (${bans.size})")
                    val colors = listOf(Color(0xFF16A34A), Color(0xFFDC2626), Color(0xFF7C3AED))
                    tabs.forEachIndexed { idx, label ->
                        val selected = activeTab == idx
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(13.dp))
                                .background(if (selected) Color.White else Color.Transparent)
                                .clickable { activeTab = idx }
                                .padding(vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = if (selected) colors[idx] else Color(0xFF6B7280)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))

                if (loading) {
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.size(32.dp))
                    }
                } else if (activeTab == 2) {
                    // Bans tab
                    if (bans.isEmpty()) {
                        Text("No banned users.", modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp), textAlign = TextAlign.Center, color = Color(0xFF9CA3AF), fontSize = 12.sp)
                    } else {
                        LazyColumn(modifier = Modifier.weight(1f)) {
                            items(bans) { ban ->
                                val userId = (ban["bannedUid"] ?: ban["id"])?.toString() ?: ""
                                val bannedUntil = ban["bannedUntil"]
                                val expiryText = when {
                                    bannedUntil == null -> "Permanent"
                                    bannedUntil is com.google.firebase.Timestamp -> {
                                        val left = bannedUntil.toDate().time - System.currentTimeMillis()
                                        if (left <= 0) "Expired" else "${(left / 3600000).coerceAtLeast(1)}h left"
                                    }
                                    else -> ""
                                }
                                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFFDC2626).copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                                        Text("🚫", fontSize = 14.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(userId.take(12), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                                        Text("Status: $expiryText", fontSize = 10.sp, color = Color(0xFF9CA3AF))
                                    }
                                    Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFFFEF2F2)).border(1.dp, Color(0xFFFCA5A5), RoundedCornerShape(12.dp)).clickable { handleUnban(userId) }.padding(horizontal = 10.dp, vertical = 5.dp)) {
                                        Text("Unban", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFFDC2626))
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Entries or Kicks tab
                    if (filteredLogs.isEmpty()) {
                        Text(
                            if (activeTab == 0) "No room entries logged yet." else "No kicks logged yet.",
                            modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp), textAlign = TextAlign.Center, color = Color(0xFF9CA3AF), fontSize = 12.sp
                        )
                    } else {
                        LazyColumn(modifier = Modifier.weight(1f)) {
                            items(filteredLogs) { log ->
                                val isKick = log["type"] == "kick"
                                val userName = log["targetName"]?.toString() ?: log["username"]?.toString() ?: "User"
                                val adminName = log["adminName"]?.toString() ?: "Admin"
                                val timestamp = log["timestamp"]
                                val timeStr = when (timestamp) {
                                    is com.google.firebase.Timestamp -> {
                                        val cal = java.util.Calendar.getInstance().apply { time = timestamp.toDate() }
                                        "%02d:%02d".format(cal.get(java.util.Calendar.HOUR_OF_DAY), cal.get(java.util.Calendar.MINUTE))
                                    }
                                    else -> ""
                                }

                                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(if (isKick) Color(0xFFDC2626).copy(alpha = 0.1f) else Color(0xFF16A34A).copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                                        Text(if (isKick) "🚷" else "📥", fontSize = 14.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(userName, fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color(0xFF111827))
                                        if (isKick) {
                                            Text("Kicked by $adminName", fontSize = 10.sp, color = Color(0xFF4B5563), fontWeight = FontWeight.SemiBold)
                                        } else {
                                            Text("entered room", fontSize = 10.sp, color = Color(0xFF16A34A), fontWeight = FontWeight.SemiBold)
                                        }
                                        Text(timeStr, fontSize = 10.sp, color = Color(0xFF9CA3AF))
                                    }
                                    if (isKick) {
                                        val userId = log["userId"]?.toString() ?: ""
                                        if (userId.isNotEmpty()) {
                                            Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFFFEF2F2)).border(1.dp, Color(0xFFFCA5A5), RoundedCornerShape(12.dp)).clickable { handleUnban(userId) }.padding(horizontal = 10.dp, vertical = 5.dp)) {
                                                Text("Unban", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFFDC2626))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                ) {
                    Text("Close", color = Color.White)
                }
            }
        }
    }
}

data class RoomThemeConfig(
    val id: String,
    val name: String,
    val filename: String,
    val category: String,
    val drawableRes: Int = 0
)

val ROOM_THEMES_LIST = listOf(
    RoomThemeConfig("ummy_prime", "Ummy Prime", "ummy_prime.png", "general"),
    RoomThemeConfig("neon_universe", "Neon Universe", "neon_night_scenic.png", "entertainment"),
    RoomThemeConfig("emoji_party", "Emoji Party", "ummy_emoji_party.png", "entertainment"),
    RoomThemeConfig("hacker_room", "Hacker Room", "coding_hacker_v2.png", "entertainment"),
    RoomThemeConfig("arcade_room", "Arcade Room", "gaming_arcade_v2.png", "entertainment"),
    RoomThemeConfig("heartbeat_room", "Heartbeat Room", "heartbeat_arcade_scenic.png", "entertainment"),
    RoomThemeConfig("gentle_lounge", "Gentle Lounge", "user_pink_bubbles.jpg", "entertainment"),
    RoomThemeConfig("support_hub", "Support Hub", "official_hub_light.png", "help"),
    RoomThemeConfig("knowledge_center", "Knowledge Center", "official_hub_dark.png", "help"),
    RoomThemeConfig("summary_guide", "Summary Guide", "help_center_light.png", "help"),
    RoomThemeConfig("friendly_guide", "Friendly Guide", "friendly_guide_scenic.png", "help"),
    RoomThemeConfig("minimal_help", "Minimal Help", "minimal_help_v2.png", "help"),
    RoomThemeConfig("celestial_love", "Celestial Love", "celestial_love.png", "entertainment"),
    RoomThemeConfig("moonlit_romance", "Moonlit Romance", "moonlit_romance.png", "entertainment"),
    RoomThemeConfig("midnight_proposal", "Midnight Proposal", "midnight_proposal.png", "entertainment"),
    RoomThemeConfig("dreamy_hearts", "Dreamy Hearts", "dreamy_hearts.png", "entertainment"),
    RoomThemeConfig("sunset_shore", "Sunset Shore", "sunset_shore.png", "entertainment"),
    RoomThemeConfig("ummy_love_vibes", "Ummy Love Vibes", "ummy_love_vibes.png", "entertainment"),
    RoomThemeConfig("ummy_emoji_party", "Ummy Fun Emoji Party", "ummy_emoji_party.png", "entertainment"),
    RoomThemeConfig("ummy_support_hub", "Ummy Support Center", "ummy_support_hub.png", "help"),
    RoomThemeConfig("ummy_golden_glow", "Ummy Golden Glow", "ummy_golden_glow.png", "general"),
    RoomThemeConfig("ummy_neon_night", "Ummy Neon Night", "ummy_neon_night.png", "general"),
    RoomThemeConfig("ummy_galaxy", "Ummy Galaxy", "ummy_galaxy.png", "general"),
    RoomThemeConfig("ummy_spring_garden", "Ummy Spring Garden", "ummy_spring_garden.png", "general"),
    RoomThemeConfig("ummy_help_desk", "Ummy Help Desk", "ummy_help_desk.png", "help"),
    RoomThemeConfig("ummy_help_guide", "Ummy Help Guide", "ummy_help_guide.png", "help"),
    RoomThemeConfig("support_theme_1", "Support Theme 1", "", "help", app.vercel.ummy_chat.twa.R.drawable.support_theme_1),
    RoomThemeConfig("support_theme_2", "Support Theme 2", "", "help", app.vercel.ummy_chat.twa.R.drawable.support_theme_2),
    RoomThemeConfig("support_theme_3", "Support Theme 3", "", "help", app.vercel.ummy_chat.twa.R.drawable.support_theme_3),
    RoomThemeConfig("scenic_neon_night_v2_new", "Neon Night Scenic", "neon_night_scenic.png", "general"),
    RoomThemeConfig("celestial_love_v2_new", "Celestial Love V2", "celestial_love_v2.png", "general"),
    RoomThemeConfig("ummy_galaxy_v2_new", "Ummy Galaxy V2", "ummy_galaxy_v2.png", "general"),
    RoomThemeConfig("halloween_2025_v2_new", "Halloween 2025 V2", "halloween_2025_v2.png", "general"),
    RoomThemeConfig("friendly_guide_scenic_new", "Friendly Guide Scenic", "friendly_guide_scenic.png", "help"),
    RoomThemeConfig("birthday_special_scenic_v3", "Birthday Party", "user_pink_bubbles.jpg", "entertainment"),
    RoomThemeConfig("holiday_village_premium", "Holiday Village Alpine", "user_winter_village.jpg", "seasonal"),
    RoomThemeConfig("beach_luxury_scenic_premium", "Beach Luxury Lounge", "user_beach_sunset.jpg", "entertainment"),
    RoomThemeConfig("eid_special_scenic_v3", "Eid Special Night", "user_ramadan_lantern.jpg", "entertainment"),
    RoomThemeConfig("christmas_cozy_scenic_new", "Christmas Cozy Scenic", "user_winter_snow.jpg", "entertainment"),
    RoomThemeConfig("holi_scenic_new", "Holi Festival Scenic", "user_holi_festival.jpg", "entertainment"),
    RoomThemeConfig("coding_hacker_v2_new", "Hacker Room V2", "coding_hacker_v2.png", "entertainment"),
    RoomThemeConfig("gaming_arcade_v2_new", "Gaming Arcade V2", "gaming_arcade_v2.png", "entertainment"),
    RoomThemeConfig("dreamy_hearts_v2_new", "Dreamy Hearts V2", "dreamy_hearts_v2.png", "entertainment"),
    RoomThemeConfig("user_desert_tent", "Desert Sunset Tent", "user_desert_tent.jpg", "user_choice"),
    RoomThemeConfig("user_sakura_bridge", "Cherry Blossom Bridge", "user_sakura_bridge.jpg", "user_choice"),
    RoomThemeConfig("user_shiva_divine", "Divine Shiva Meditation", "user_shiva_divine.jpg", "user_choice"),
    RoomThemeConfig("user_holi_group", "Holi Colors Celebration", "user_holi_group.jpg", "user_choice"),
    RoomThemeConfig("user_starry_campfire", "Starry Night Campfire", "user_starry_campfire.jpg", "user_choice"),
    RoomThemeConfig("user_crescent_moon", "Crescent Moon Night", "user_crescent_moon.jpg", "user_choice"),
    RoomThemeConfig("user_krishna_divine", "Divine Krishna Glow", "user_krishna_divine.jpg", "user_choice"),
    RoomThemeConfig("user_beach_dinner_2", "Beach Candlelight Dinner", "user_beach_dinner_2.jpg", "user_choice"),
    RoomThemeConfig("user_shiva_meditation_2", "Shiva Mountain Glow", "user_shiva_meditation_2.jpg", "user_choice"),
    RoomThemeConfig("user_starry_night", "Clear Starry Night", "user_starry_night.jpg", "user_choice"),
    RoomThemeConfig("user_buddha_gold", "Golden Buddha Spirit", "user_buddha_gold.jpg", "user_choice"),
    RoomThemeConfig("user_golden_temple", "Golden Temple Divine", "user_golden_temple.jpg", "user_choice"),
    RoomThemeConfig("user_shiva_cave", "Shiva Cave Waterfall", "user_shiva_cave.jpg", "user_choice"),
    RoomThemeConfig("user_shiva_cosmic", "Cosmic Shiva Spirit", "user_shiva_cosmic.jpg", "user_choice"),
    RoomThemeConfig("user_desert_prayer", "Desert Night Prayer", "user_desert_prayer.jpg", "user_choice"),
    RoomThemeConfig("user_evening_prayer", "Evening Prayer Sunset", "user_evening_prayer.jpg", "user_choice"),
    RoomThemeConfig("user_diwali_diyas", "Diwali Golden Diyas", "user_diwali_diyas.jpg", "user_choice"),
    RoomThemeConfig("user_shiva_glow", "Golden Shiva Glow", "user_shiva_glow.jpg", "user_choice"),
    RoomThemeConfig("user_divine_ascension", "Divine Spirit Ascension", "user_divine_ascension.jpg", "user_choice"),
    RoomThemeConfig("user_mosque_night", "Mosque Night Spirit", "user_mosque_night.jpg", "islamic"),
    RoomThemeConfig("user_shiva_dark_art", "Shiva Dark Meditation", "user_shiva_dark_art.png", "user_choice")
)

@Composable
fun RoomThemeModal(
    roomId: String,
    ownedItemIds: List<String> = emptyList(),
    itemExpiries: Map<String, Any> = emptyMap(),
    isOfficialUser: Boolean = false,
    onDismiss: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }
    val themeContext = androidx.compose.ui.platform.LocalContext.current

    // RN ownership/expiry logic
    val isOwned: (String) -> Boolean = remember(ownedItemIds, itemExpiries, isOfficialUser) {
        { themeId: String ->
            if (isOfficialUser) true
            else if (themeId !in ownedItemIds) false
            else {
                val exp = itemExpiries[themeId]
                if (exp != null) {
                    val expDate = when (exp) {
                        is com.google.firebase.Timestamp -> exp.toDate()
                        is Long -> java.util.Date(exp)
                        is String -> try { java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).parse(exp) } catch (e: Exception) { null }
                        else -> null
                    }
                    expDate != null && expDate.after(java.util.Date())
                } else true
            }
        }
    }

    val filteredThemes = remember {
        ROOM_THEMES_LIST
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            tonalElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .height(480.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Select Room Theme",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredThemes) { theme ->
                        val imageUrl = if (theme.drawableRes != 0) "" else "https://ummy-chat.vercel.app/themes/${theme.filename}"
                        
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                                .clickable(enabled = !isLoading) {
                                    isLoading = true
                                    scope.launch {
                                        try {
                                            val fs = FirebaseFirestore.getInstance()
                                            val bgUrl: String = if (theme.drawableRes != 0) {
                                                // Upload local drawable to Firebase Storage
                                                val ctx = themeContext
                                                val uri = android.net.Uri.parse("android.resource://${ctx.packageName}/${theme.drawableRes}")
                                                val ref = com.google.firebase.storage.FirebaseStorage.getInstance()
                                                    .reference.child("themes/${theme.id}.png")
                                                ref.putFile(uri).await()
                                                ref.downloadUrl.await().toString()
                                            } else {
                                                imageUrl
                                            }
                                            fs.collection("chatRooms").document(roomId)
                                                .update(
                                                    mapOf(
                                                        "roomThemeId" to theme.id,
                                                        "backgroundUrl" to bgUrl
                                                    )
                                                ).await()
                                            onDismiss()
                                        } catch (e: Exception) {
                                            e.printStackTrace()
                                        } finally {
                                            isLoading = false
                                        }
                                    }
                                }
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                if (theme.drawableRes != 0) {
                                    androidx.compose.foundation.Image(
                                        painter = androidx.compose.ui.res.painterResource(id = theme.drawableRes),
                                        contentDescription = theme.name,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(imageUrl),
                                        contentDescription = theme.name,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color.Black.copy(alpha = 0.35f))
                                )
                                Text(
                                    text = theme.name,
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .padding(8.dp),
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                ) {
                    Text("Cancel", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun RoomAiThemeModal(
    roomId: String,
    onDismiss: () -> Unit
) {
    var prompt by remember { mutableStateOf("") }
    var generating by remember { mutableStateOf(false) }
    var statusText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            tonalElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "AI Theme Architect",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Describe the theme you want to create and let AI build it.",
                    fontSize = 13.sp,
                    color = Color(0xFF64748B),
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = prompt,
                    onValueChange = { prompt = it },
                    placeholder = { Text("e.g. A futuristic space station lounge with neon lights") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    enabled = !generating
                )

                if (statusText.isNotBlank()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = statusText,
                        fontSize = 13.sp,
                        color = if (statusText.contains("Failed") || statusText.contains("Error")) Color.Red else Color(0xFF7C3AED),
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss, enabled = !generating) {
                        Text("Cancel", color = Color(0xFF64748B))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = {
                            if (prompt.isBlank()) return@Button
                            generating = true
                            statusText = "Architecting theme..."
                            scope.launch(kotlinx.coroutines.Dispatchers.IO) {
                                try {
                                    val conn = java.net.URL("https://api.ummylive.com/ai/theme-architect").openConnection() as java.net.HttpURLConnection
                                    conn.requestMethod = "POST"
                                    conn.setRequestProperty("Content-Type", "application/json")
                                    conn.doOutput = true
                                    val escapedPrompt = prompt.replace("\"", "\\\"").replace("\n", " ")
                                    val payload = "{\"prompt\":\"$escapedPrompt\",\"roomId\":\"$roomId\"}"
                                    conn.outputStream.write(payload.toByteArray())
                                    
                                    if (conn.responseCode == 200) {
                                        val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                                        val url = responseText.substringAfter("\"url\":\"").substringBefore("\"")
                                        val themeId = responseText.substringAfter("\"themeId\":\"").substringBefore("\"").takeIf { !it.contains("{") } ?: "ai_${System.currentTimeMillis()}"
                                        val accentColor = responseText.substringAfter("\"accentColor\":\"").substringBefore("\"").takeIf { !it.contains("{") }
                                        
                                        FirebaseFirestore.getInstance().collection("chatRooms")
                                            .document(roomId)
                                            .update(
                                                mapOf(
                                                    "backgroundUrl" to url,
                                                    "roomThemeId" to themeId,
                                                    "accentColor" to accentColor
                                                )
                                            ).await()
                                        
                                        scope.launch {
                                            statusText = "Applied successfully!"
                                            onDismiss()
                                        }
                                    } else {
                                        val fallbackUrl = "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200"
                                        FirebaseFirestore.getInstance().collection("chatRooms")
                                            .document(roomId)
                                            .update(
                                                mapOf(
                                                    "backgroundUrl" to fallbackUrl,
                                                    "roomThemeId" to "ai_fallback"
                                                )
                                            ).await()
                                        
                                        scope.launch {
                                            statusText = "API error, applied fallback theme!"
                                            onDismiss()
                                        }
                                    }
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                    val fallbackUrl = "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200"
                                    try {
                                        FirebaseFirestore.getInstance().collection("chatRooms")
                                            .document(roomId)
                                            .update(
                                                mapOf(
                                                    "backgroundUrl" to fallbackUrl,
                                                    "roomThemeId" to "ai_fallback"
                                                )
                                            ).await()
                                    } catch (ex: Exception) { ex.printStackTrace() }
                                    
                                    scope.launch {
                                        statusText = "Applied fallback theme!"
                                        onDismiss()
                                    }
                                } finally {
                                    generating = false
                                }
                            }
                        },
                        enabled = !generating && prompt.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                    ) {
                        if (generating) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Generate")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RoomSettingsModals(
    roomId: String,
    showEditNameModal: Boolean,
    showAnnouncementModal: Boolean,
    showMicTestModal: Boolean,
    showSeatCountModal: Boolean,
    showPasswordModal: Boolean,
    showThemeModal: Boolean,
    showAiThemeModal: Boolean,
    showTagModal: Boolean,
    showAdminsModal: Boolean,
    showLogsModal: Boolean,
    onDismissEditName: () -> Unit,
    onDismissAnnouncement: () -> Unit,
    onDismissMicTest: () -> Unit,
    onDismissSeatCount: () -> Unit,
    onDismissPassword: () -> Unit,
    onDismissTheme: () -> Unit,
    onDismissAiTheme: () -> Unit,
    onDismissTag: () -> Unit,
    onDismissAdmins: () -> Unit,
    onDismissLogs: () -> Unit,
    currentRoomName: String = "",
    currentAnnouncement: String = "",
    currentSeats: Int = 9,
    currentTag: String = "Chat",
    currentAdmins: List<String> = emptyList(),
    currentBannedUsers: List<String> = emptyList(),
    ownedItemIds: List<String> = emptyList(),
    itemExpiries: Map<String, Any> = emptyMap(),
    isOfficialUser: Boolean = false,
    participants: List<app.vercel.ummy_chat.twa.data.model.RoomParticipant> = emptyList(),
    ownerId: String = "",
    currentUid: String = ""
) {
    if (showEditNameModal) {
        EditNameModal(
            roomId = roomId,
            currentName = currentRoomName,
            onDismiss = onDismissEditName
        )
    }
    if (showAnnouncementModal) {
        EditAnnouncementModal(
            roomId = roomId,
            currentAnnouncement = currentAnnouncement,
            onDismiss = onDismissAnnouncement
        )
    }
    if (showMicTestModal) {
        MicTestModal(onDismiss = onDismissMicTest)
    }
    if (showSeatCountModal) {
        MicCountModal(
            roomId = roomId,
            currentSeats = currentSeats,
            onDismiss = onDismissSeatCount
        )
    }
    if (showPasswordModal) {
        PasswordModal(roomId = roomId, onDismiss = onDismissPassword)
    }
    if (showThemeModal) {
        RoomThemeModal(
            roomId = roomId,
            ownedItemIds = ownedItemIds,
            itemExpiries = itemExpiries,
            isOfficialUser = isOfficialUser,
            onDismiss = onDismissTheme
        )
    }
    if (showAiThemeModal) {
        RoomAiThemeModal(
            roomId = roomId,
            onDismiss = onDismissAiTheme
        )
    }
    if (showTagModal) {
        RoomTagModal(
            roomId = roomId,
            currentTag = currentTag,
            onDismiss = onDismissTag
        )
    }
    if (showAdminsModal) {
        RoomAdminModal(
            roomId = roomId,
            initialAdmins = currentAdmins,
            participants = participants,
            ownerId = ownerId,
            currentUid = currentUid,
            onDismiss = onDismissAdmins
        )
    }
    if (showLogsModal) {
        RoomLogsModal(
            roomId = roomId,
            onDismiss = onDismissLogs
        )
    }
}
