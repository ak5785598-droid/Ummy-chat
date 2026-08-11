package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.MessageModel
import coil.compose.AsyncImage
import kotlinx.coroutines.launch

// ─────────────────────────────────────────────────────────────────────────────
// RoomChatArea — mirrors RN ChatBubbles + Announcement area
// Auto-scrolls on new message, reverseLayout so newest at bottom
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun RoomChatArea(
    messages: List<MessageModel>,
    announcement: String,
    chatClearedAt: com.google.firebase.Timestamp? = null,
    currentUserId: String,
    onMsgLongPress: (MessageModel) -> Unit,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutine = rememberCoroutineScope()
    val sessionStartTime = remember { com.google.firebase.Timestamp.now() }

    // Show announcements only if chatClearedAt is before session start (RN parity)
    val showAnnouncements = chatClearedAt == null || chatClearedAt < sessionStartTime

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            coroutine.launch { listState.animateScrollToItem(messages.size - 1) }
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // ── System & Room Announcements pinned at top (hidden if chat cleared this session) ──
            if (showAnnouncements) {
                item(key = "system_announce") {
                    SystemAnnouncementBanner("Welcome to Ummy! Any content related to porn, fraud, violence, abuse, or fake officials will be banned.")
                    Spacer(modifier = Modifier.height(6.dp))
                }
                
                if (announcement.isNotBlank()) {
                    item(key = "announce") {
                        AnnouncementBanner(announcement)
                        Spacer(modifier = Modifier.height(6.dp))
                    }
                }
            }

            // ── Chat messages ──
            items(messages, key = { it.id }) { msg ->
                when (msg.type) {
                    "entrance" -> EntranceBubble(msg)
                    "system"   -> SystemBubble(msg)
                    "gift"     -> GiftChatBubble(msg)
                    "lucky-rain","loot" -> LootChatBubble(msg)
                    "mic_invite" -> MicInviteBubble(msg, currentUserId)
                    "image"    -> ImageChatBubble(msg, currentUserId, onMsgLongPress)
                    else       -> TextChatBubble(msg, currentUserId, onMsgLongPress)
                }
            }

            item { Spacer(modifier = Modifier.height(8.dp)) }
        }
    }
}

// ── Announcement banner ───────────────────────────────────────────────────────
@Composable
fun AnnouncementBanner(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .clip(RoundedCornerShape(8.dp))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF064E3B).copy(alpha = 0.5f), // Emerald 900
                        Color(0xFF064E3B).copy(alpha = 0.05f)
                    )
                )
            )

            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Text(
            text = text,
            color = Color(0xFF34D399), // Emerald 400
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 12.sp
        )
    }
}

// ── System Announcement banner ────────────────────────────────────────────────
@Composable
fun SystemAnnouncementBanner(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .clip(RoundedCornerShape(8.dp))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF312E81).copy(alpha = 0.85f), // Indigo 900
                        Color(0xFF312E81).copy(alpha = 0.4f)
                    )
                )
            )

            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Text(
            text = text,
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 12.sp
        )
    }
}

// ── Normal text bubble ────────────────────────────────────────────────────────
@Composable
fun TextChatBubble(
    msg: MessageModel,
    currentUserId: String,
    onLongPress: (MessageModel) -> Unit
) {
    val isMe = msg.senderId == currentUserId
    val nameColor = when {
        isMe -> Color(0xFFA78BFA)
        else -> Color((Color(0xFF818CF8).value.toLong() + (msg.senderId.hashCode().toLong() and 0xFFFFFF)).toULong())
    }.let {
        // Clamp to visible color range
        Color(0xFF818CF8)
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        // Avatar
        AsyncImage(
            model = msg.senderAvatar ?: "https://picsum.photos/seed/${msg.senderId}/40",
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(26.dp)
                .clip(CircleShape)
                .background(Color.Gray)
        )
        Spacer(modifier = Modifier.width(6.dp))

        // Bubble
        Column(modifier = Modifier.weight(1f)) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                    .background(
                        if (isMe) Color(0xFF312E81).copy(alpha = 0.85f)
                        else Color.Black.copy(alpha = 0.45f)
                    )
                    .clickable { onLongPress(msg) }
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    text = buildAnnotatedString {
                        withStyle(SpanStyle(color = Color(0xFF818CF8), fontWeight = FontWeight.Bold, fontSize = 11.sp)) {
                            append(msg.senderName)
                        }
                        append("  ")
                        withStyle(SpanStyle(color = Color.White, fontSize = 12.sp)) {
                            append(msg.displayContent)
                        }
                    }
                )
            }
        }
    }
}

// ── Image bubble ──────────────────────────────────────────────────────────────
@Composable
fun ImageChatBubble(
    msg: MessageModel,
    currentUserId: String,
    onLongPress: (MessageModel) -> Unit
) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        AsyncImage(
            model = msg.senderAvatar ?: "https://picsum.photos/seed/${msg.senderId}/40",
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(26.dp).clip(CircleShape).background(Color.Gray)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Column {
            Text(msg.senderName, color = Color(0xFF818CF8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(3.dp))
            AsyncImage(
                model = msg.imageUrl,
                contentDescription = "Shared Image",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(140.dp, 100.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onLongPress(msg) }
            )
        }
    }
}

// ── System bubble ─────────────────────────────────────────────────────────────
// mirrors RN room-chat-area.tsx L148-152 + L299-313: black pill, maxWidth 85%
@Composable
fun SystemBubble(msg: MessageModel) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 32.dp, top = 4.dp, bottom = 4.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Text(
            text = msg.content.ifBlank { msg.text ?: "" },
            color = Color(0xB3FFFFFF),   // rgba(255,255,255,0.7)
            fontSize = 10.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(Color(0x59000000), RoundedCornerShape(12.dp)) // rgba(0,0,0,0.35)
                .padding(horizontal = 12.dp, vertical = 4.dp)
        )
    }
}

// ── Entrance bubble ───────────────────────────────────────────────────────────
// mirrors RN room-chat-area.tsx L156-164: centered amber pill, no avatar
@Composable
fun EntranceBubble(msg: MessageModel) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "✨ ${msg.senderName} entered the room",
            color = Color(0xFFFBBF24),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .background(Color(0x1FFBBF24), RoundedCornerShape(12.dp))   // rgba(251,191,36,0.12)
                .border(1.dp, Color(0x33FBBF24), RoundedCornerShape(12.dp)) // rgba(251,191,36,0.2)
                .padding(horizontal = 14.dp, vertical = 6.dp)
        )
    }
}

// ── Gift bubble ───────────────────────────────────────────────────────────────
@Composable
fun GiftChatBubble(msg: MessageModel) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFF7C3AED).copy(alpha = 0.7f), Color(0xFFEC4899).copy(alpha = 0.7f))
                )
            )
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(msg.giftIcon ?: "🎁", fontSize = 18.sp)
        Spacer(modifier = Modifier.width(6.dp))
        Column {
            Text(
                text = "${msg.senderName} sent ${msg.giftName ?: "a gift"}",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
            if (msg.comboCount > 1) {
                Text("x${msg.comboCount} combo! 🔥", color = Color(0xFFFBBF24), fontSize = 10.sp)
            }
        }
    }
}

// ── Loot bubble ───────────────────────────────────────────────────────────────
@Composable
fun LootChatBubble(msg: MessageModel) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFFFACC15).copy(alpha = 0.7f), Color(0xFFEF4444).copy(alpha = 0.7f))
                )
            )
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("🏆", fontSize = 18.sp)
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = "${msg.senderName} sent Lucky Rain! 💰",
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ── Mic Invite bubble ─────────────────────────────────────────────────────────
@Composable
fun MicInviteBubble(msg: MessageModel, currentUserId: String) {
    val isForMe = msg.content.contains(currentUserId)
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(
                    if (isForMe) Color(0xFF06B6D4).copy(alpha = 0.6f)
                    else Color.Black.copy(alpha = 0.4f)
                )
                .padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("🎙️", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = if (isForMe) "${msg.senderName} invited you to the mic!"
                       else "${msg.senderName} sent a mic invite",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
