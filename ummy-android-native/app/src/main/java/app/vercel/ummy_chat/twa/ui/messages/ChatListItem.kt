package app.vercel.ummy_chat.twa.ui.messages

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class PrivateChat(
    val id: String = "",
    val participantIds: List<String> = emptyList(),
    val lastMessage: String = "Sent a vibe",
    val lastSenderId: String = "",
    val lastMessageReadBy: List<String> = emptyList(),
    val updatedAt: Long = 0L,
    val pinnedBy: List<String> = emptyList()
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatListItem(
    chat: PrivateChat,
    currentUid: String,
    onClick: (name: String, avatar: String) -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val fs = FirebaseFirestore.getInstance()
    var otherUsername by remember { mutableStateOf("") }
    var otherAvatar by remember { mutableStateOf("") }
    var otherIsOnline by remember { mutableStateOf(false) }
    var otherLastSeen by remember { mutableStateOf<Timestamp?>(null) }

    val otherUid = chat.participantIds.firstOrNull { it != currentUid } ?: ""

    LaunchedEffect(otherUid) {
        if (otherUid.isBlank()) return@LaunchedEffect
        // Fetch from main user doc
        fs.collection("users").document(otherUid)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    otherUsername = snapshot.getString("username")
                        ?: snapshot.getString("displayName")
                        ?: snapshot.getString("name")
                        ?: "User"
                    otherAvatar = snapshot.getString("avatarUrl")
                        ?: snapshot.getString("photoURL")
                        ?: snapshot.getString("profileImage")
                        ?: ""
                    otherIsOnline = snapshot.getBoolean("isOnline") ?: false
                    otherLastSeen = snapshot.getTimestamp("lastSeen")
                }
            }
        // Also check profile subcollection (RN stores avatar there)
        try {
            val profileDoc = fs.collection("users").document(otherUid)
                .collection("profile").document(otherUid).get().await()
            if (profileDoc.exists()) {
                val pName = profileDoc.getString("username")
                    ?: profileDoc.getString("displayName")
                val pAvatar = profileDoc.getString("avatarUrl")
                    ?: profileDoc.getString("photoURL")
                if (!pName.isNullOrBlank() && otherUsername == "User") otherUsername = pName
                if (!pAvatar.isNullOrBlank() && otherAvatar.isBlank()) otherAvatar = pAvatar
            }
        } catch (_: Exception) {}
    }

    val isOnline = remember(otherIsOnline, otherLastSeen) {
        otherIsOnline && otherLastSeen != null &&
                (System.currentTimeMillis() - (otherLastSeen?.toDate()?.time ?: 0)) < 120000
    }

    val isUnread = remember(chat, currentUid) {
        chat.lastSenderId != currentUid && !chat.lastMessageReadBy.contains(currentUid)
    }
    val isPinned = remember(chat, currentUid) {
        chat.pinnedBy.contains(currentUid)
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                when {
                    isUnread -> Color(0xFFFFF0F5)
                    else -> Color.White
                }
            )
            .then(
                if (isPinned) Modifier.border(4.dp, Color(0xFFF472B6), RoundedCornerShape(16.dp))
                else Modifier.border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
            )
            .combinedClickable(onClick = { onClick(otherUsername, otherAvatar) }, onLongClick = onLongClick)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar + Online dot
        Box(modifier = Modifier.size(48.dp)) {
            AsyncImage(
                model = (CdnUtils.toCdn(otherAvatar) ?: "").ifBlank { "https://picsum.photos/100" },
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .border(1.dp, Color(0xFFF1F5F9), CircleShape),
                contentScale = ContentScale.Crop
            )
            // Online dot
            if (isOnline) {
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .align(Alignment.BottomEnd)
                        .clip(CircleShape)
                        .background(Color(0xFF22C55E))
                        .border(2.dp, Color.White, CircleShape)
                )
            }
            // Unread dot
            if (isUnread) {
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .align(Alignment.TopEnd)
                        .offset(x = 2.dp, y = (-2).dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF472B6))
                        .border(2.dp, Color.White, CircleShape)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Info column
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    otherUsername,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isUnread) Color(0xFFDB2777) else Color(0xFF1E293B),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Text(
                    formatChatTime(chat.updatedAt),
                    fontSize = 10.sp,
                    color = Color(0xFF94A3B8),
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    chat.lastMessage,
                    fontSize = 13.sp,
                    color = if (isUnread) Color(0xFF1E293B) else Color(0xFF64748B),
                    fontWeight = if (isUnread) FontWeight.Bold else FontWeight.Normal,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                if (isPinned) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("\uD83D\uDCCC", fontSize = 10.sp)
                }
            }
        }
    }
}

private fun formatChatTime(timestamp: Long): String {
    if (timestamp == 0L) return ""
    val date = Date(timestamp)
    val now = Calendar.getInstance()
    val chatTime = Calendar.getInstance().apply { time = date }

    return when {
        now.get(Calendar.YEAR) == chatTime.get(Calendar.YEAR) &&
                now.get(Calendar.DAY_OF_YEAR) == chatTime.get(Calendar.DAY_OF_YEAR) -> {
            SimpleDateFormat("h:mm a", Locale.getDefault()).format(date)
        }
        now.get(Calendar.YEAR) == chatTime.get(Calendar.YEAR) &&
                now.get(Calendar.DAY_OF_YEAR) - chatTime.get(Calendar.DAY_OF_YEAR) == 1 -> {
            "Yesterday"
        }
        now.get(Calendar.YEAR) == chatTime.get(Calendar.YEAR) &&
                now.get(Calendar.DAY_OF_YEAR) - chatTime.get(Calendar.DAY_OF_YEAR) < 7 -> {
            SimpleDateFormat("EEE", Locale.getDefault()).format(date)
        }
        else -> {
            SimpleDateFormat("MMM d", Locale.getDefault()).format(date)
        }
    }
}
