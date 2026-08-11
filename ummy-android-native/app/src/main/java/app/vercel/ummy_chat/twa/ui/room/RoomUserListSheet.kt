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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.RoomParticipant
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomUserListSheet(
    visible: Boolean,
    onDismiss: () -> Unit,
    participants: List<RoomParticipant>,
    roomId: String,
    ownerId: String,
    moderatorIds: List<String>,
    currentUserId: String,
    onUserPress: (String) -> Unit,
    onAcceptMicRequest: (String, Int) -> Unit,
    onRejectMicRequest: (String) -> Unit
) {
    if (!visible) return

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var activeTab by remember { mutableStateOf("users") } // "users" | "requests"

    val sorted = remember(participants, ownerId, moderatorIds) {
        participants.sortedWith { a, b ->
            when {
                a.uid == ownerId -> -1
                b.uid == ownerId -> 1
                moderatorIds.contains(a.uid) && !moderatorIds.contains(b.uid) -> -1
                !moderatorIds.contains(a.uid) && moderatorIds.contains(b.uid) -> 1
                else -> b.seatIndex.compareTo(a.seatIndex)
            }
        }
    }

    val micRequests = remember(participants) {
        participants.filter { it.isRequestingMic }
    }

    val isOwnerOrMod = remember(currentUserId, ownerId, moderatorIds) {
        currentUserId == ownerId || moderatorIds.contains(currentUserId)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color(0xFF0F172A), // slate-900 parity
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .size(40.dp, 4.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(bottom = 20.dp)
        ) {
            // Header Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 8.dp)
                    .drawBehind {
                        // Border bottom parity
                        drawLine(
                            color = Color.White.copy(alpha = 0.1f),
                            start = Offset(0f, size.height),
                            end = Offset(size.width, size.height),
                            strokeWidth = 1.dp.toPx()
                        )
                    },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Users Tab
                    Column(
                        modifier = Modifier.clickable { activeTab = "users" },
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Users (${sorted.size})",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (activeTab == "users") Color(0xFFFACC15) else Color.White.copy(alpha = 0.4f),
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        if (activeTab == "users") {
                            Box(
                                modifier = Modifier
                                    .height(2.dp)
                                    .width(60.dp)
                                    .background(Color(0xFFFACC15))
                            )
                        } else {
                            Spacer(modifier = Modifier.height(2.dp))
                        }
                    }

                    // Mic Requests Tab
                    Column(
                        modifier = Modifier.clickable { activeTab = "requests" },
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Text(
                                text = "Mic Requests (${micRequests.size})",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (activeTab == "requests") Color(0xFFFACC15) else Color.White.copy(alpha = 0.4f)
                            )
                            if (micRequests.isNotEmpty()) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEF4444))
                                )
                            }
                        }
                        if (activeTab == "requests") {
                            Box(
                                modifier = Modifier
                                    .height(2.dp)
                                    .width(80.dp)
                                    .background(Color(0xFFFACC15))
                            )
                        } else {
                            Spacer(modifier = Modifier.height(2.dp))
                        }
                    }
                }

                IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Scrollable Content
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 300.dp, max = 500.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
            ) {
                if (activeTab == "users") {
                    items(sorted, key = { it.uid }) { p ->
                        UserListRow(
                            p = p,
                            isOwner = p.uid == ownerId,
                            isModerator = moderatorIds.contains(p.uid) && p.uid != ownerId,
                            onPress = {
                                onDismiss()
                                onUserPress(p.uid)
                            }
                        )
                    }
                    if (sorted.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No users in room", color = Color.White.copy(alpha = 0.4f), fontSize = 13.sp)
                            }
                        }
                    }
                } else {
                    items(micRequests, key = { it.uid }) { p ->
                        LiveMicRequestRow(
                            p = p,
                            isOwnerOrMod = isOwnerOrMod,
                            onUserPress = {
                                onDismiss()
                                onUserPress(p.uid)
                            },
                            onAccept = { onAcceptMicRequest(p.uid, p.requestedSeatIndex) },
                            onReject = { onRejectMicRequest(p.uid) }
                        )
                    }
                    if (micRequests.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 48.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    Icons.Default.Mic,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.2f),
                                    modifier = Modifier.size(32.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "No mic seat requests right now",
                                    color = Color.White.copy(alpha = 0.4f),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UserListRow(
    p: RoomParticipant,
    isOwner: Boolean,
    isModerator: Boolean,
    onPress: () -> Unit
) {
    var avatarUrl by remember { mutableStateOf(p.avatarUrl) }
    var username by remember { mutableStateOf(p.name) }
    var displayId by remember { mutableStateOf("") }

    DisposableEffect(p.uid) {
        if (p.uid.isBlank()) {
            onDispose {}
        } else {
            val firestore = FirebaseFirestore.getInstance()
            val baseRef = firestore.collection("users").document(p.uid)
            val subRef = baseRef.collection("profile").document(p.uid)

            val baseListener = baseRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String
                        ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String
                        ?: data?.get("name") as? String
                    if (name != null) username = name
                    
                    val accNum = data?.get("accountNumber") as? String
                        ?: data?.get("id") as? String
                    if (accNum != null) displayId = accNum
                }
            }

            val subListener = subRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String
                        ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String
                        ?: data?.get("name") as? String
                    if (name != null) username = name
                    
                    val accNum = data?.get("accountNumber") as? String
                        ?: data?.get("id") as? String
                    if (accNum != null) displayId = accNum
                }
            }

            onDispose {
                baseListener.remove()
                subListener.remove()
            }
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onPress() }
            .padding(vertical = 8.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = CdnUtils.toCdn(avatarUrl) ?: "https://api.dicebear.com/7.x/initials/png?seed=$username",
            contentDescription = username,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape)
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = username,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                if (isOwner) {
                    Text("👑", fontSize = 12.sp)
                }
                if (isModerator) {
                    Text("🛡️", fontSize = 12.sp)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (displayId.isNotBlank()) "ID: $displayId" else "ID: ...",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 2.dp, end = 6.dp)
                )
                Text(
                    text = if (p.seatIndex > 0) "• Seat ${p.seatIndex}" else "• Audience",
                    color = Color.White.copy(alpha = 0.5f),
                    fontSize = 10.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }

        if (p.seatIndex > 0) {
            Icon(
                imageVector = if (p.isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                contentDescription = null,
                tint = if (p.isMuted) Color(0xFFEF4444) else Color(0xFF22C55E),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
fun LiveMicRequestRow(
    p: RoomParticipant,
    isOwnerOrMod: Boolean,
    onUserPress: () -> Unit,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    var avatarUrl by remember { mutableStateOf(p.avatarUrl) }
    var username by remember { mutableStateOf(p.name) }

    DisposableEffect(p.uid) {
        if (p.uid.isBlank()) {
            onDispose {}
        } else {
            val firestore = FirebaseFirestore.getInstance()
            val baseRef = firestore.collection("users").document(p.uid)
            val subRef = baseRef.collection("profile").document(p.uid)

            val baseListener = baseRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String
                        ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String
                        ?: data?.get("name") as? String
                    if (name != null) username = name
                }
            }

            val subListener = subRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String
                        ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String
                        ?: data?.get("name") as? String
                    if (name != null) username = name
                }
            }

            onDispose {
                baseListener.remove()
                subListener.remove()
            }
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onUserPress() }
            .padding(vertical = 8.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = CdnUtils.toCdn(avatarUrl) ?: "https://api.dicebear.com/7.x/initials/png?seed=$username",
            contentDescription = username,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape)
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = username,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "Requested Seat ${p.requestedSeatIndex}",
                color = Color(0xFFFACC15),
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        if (isOwnerOrMod) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Accept Button
                Button(
                    onClick = onAccept,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(99.dp),
                    modifier = Modifier.height(30.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )
                        Text("Accept", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Reject Button
                IconButton(
                    onClick = onReject,
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFEF4444).copy(alpha = 0.2f))
                        .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.3f), CircleShape)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Reject",
                        tint = Color(0xFFF87171),
                        modifier = Modifier.size(12.dp)
                    )
                }
            }
        }
    }
}
