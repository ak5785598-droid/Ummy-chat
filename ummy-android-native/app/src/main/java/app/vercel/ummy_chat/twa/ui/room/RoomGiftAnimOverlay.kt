package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import app.vercel.ummy_chat.twa.data.model.BroadcastEvent
import app.vercel.ummy_chat.twa.data.model.EntryEffect
import app.vercel.ummy_chat.twa.data.model.GiftEvent
import coil.compose.AsyncImage
import kotlinx.coroutines.delay

// ─────────────────────────────────────────────────────────────────────────────
// Gift Animation Overlay — mirrors RN GiftAnimator / GateCrack
// Shows: combo gift animations (slide-in from right, 5s)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun RoomGiftAnimOverlay(giftEvents: List<GiftEvent>) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
        Column(
            modifier = Modifier.padding(start = 12.dp, bottom = 180.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            giftEvents.takeLast(3).forEach { evt ->
                GiftAnimCard(evt)
            }
        }
    }
}

@Composable
fun GiftAnimCard(event: GiftEvent) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(event.id) {
        visible = true
        delay(4500)
        visible = false
    }

    AnimatedVisibility(
        visible = visible,
        enter = slideInHorizontally(
            initialOffsetX = { it },
            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
        ) + fadeIn(),
        exit = slideOutHorizontally { -it } + fadeOut()
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(24.dp))
                .background(Color.Black.copy(alpha = 0.65f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(24.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Sender avatar
            AsyncImage(
                model = event.senderAvatar ?: "https://picsum.photos/seed/${event.senderName}/40",
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.Gray)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(event.senderName, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(
                    "sent ${event.giftName}",
                    color = Color.White.copy(alpha = 0.75f),
                    fontSize = 10.sp
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            // Gift icon + combo
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(event.giftIcon ?: "🎁", fontSize = 26.sp)
                if (event.comboCount > 1) {
                    ComboCounter(event.comboCount)
                }
            }
        }
    }
}

@Composable
fun ComboCounter(count: Int) {
    var prevCount by remember { mutableStateOf(count) }
    val scale by animateFloatAsState(
        targetValue = if (count != prevCount) 1.4f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy),
        label = "comboScale"
    )
    SideEffect { prevCount = count }

    Box(
        modifier = Modifier
            .scale(scale)
            .clip(RoundedCornerShape(6.dp))
            .background(
                Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFFEF4444)))
            )
            .padding(horizontal = 5.dp, vertical = 1.dp)
    ) {
        Text("x$count", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Broadcast Patti — mirrors RN GlobalPattiBanner (gift top, loot bottom)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun BroadcastPattiBanner(
    event: BroadcastEvent?,
    offsetFromTop: Float = 0.25f,
    colors: List<Color>
) {
    if (event == null) return

    var visible by remember(event.id) { mutableStateOf(false) }
    LaunchedEffect(event.id) {
        visible = true
        delay(5200)
        visible = false
    }

    AnimatedVisibility(
        visible = visible,
        enter = slideInHorizontally(
            initialOffsetX = { it },
            animationSpec = tween(400, easing = FastOutSlowInEasing)
        ) + fadeIn(),
        exit = slideOutHorizontally(
            targetOffsetX = { -it },
            animationSpec = tween(300)
        ) + fadeOut(),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(46.dp)
                .background(
                    Brush.horizontalGradient(colors.map { it.copy(alpha = 0.92f) })
                )
                .border(0.5.dp, Color.White.copy(alpha = 0.25f)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(modifier = Modifier.width(12.dp))
            AsyncImage(
                model = event.giftImageUrl ?: "https://picsum.photos/seed/${event.giftName}/40",
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(30.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f))
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (event.type == "loot")
                    "🏆 ${event.senderName} opened Lucky Rain in Room #${event.roomNumber}!"
                else
                    "🎁 ${event.senderName} sent ${event.qty}x ${event.giftName} in Room #${event.roomNumber}",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            Box(
                modifier = Modifier
                    .padding(end = 10.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color.White.copy(alpha = 0.25f))
                    .padding(horizontal = 10.dp, vertical = 3.dp)
            ) {
                Text("ENTER", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Effect Overlay — appears for 5s when someone enters
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun EntryEffectOverlay(effect: EntryEffect) {
    var visible by remember(effect.username) { mutableStateOf(false) }
    LaunchedEffect(effect.username) {
        visible = true
        delay(4800)
        visible = false
    }

    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            Color(0xFF8B5CF6).copy(alpha = 0.85f),
                            Color(0xFFEC4899).copy(alpha = 0.85f)
                        )
                    )
                )
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = effect.avatarUrl ?: "https://picsum.photos/seed/${effect.username}/50",
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(36.dp).clip(CircleShape).background(Color.Gray)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(effect.username, color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
                Text("entered the room ✨", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trophy Badge — top-right
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun TrophyBadge(dailyGifts: Long) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color.Black.copy(alpha = 0.55f))
            .border(1.dp, Color(0xFFFBBF24).copy(alpha = 0.4f), RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("🏆", fontSize = 13.sp)
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            formatCount(dailyGifts),
            color = Color(0xFFFBBF24),
            fontSize = 11.sp,
            fontWeight = FontWeight.Black
        )
    }
}

private fun formatCount(n: Long): String = when {
    n >= 1_000_000 -> "${n / 1_000_000}M"
    n >= 1_000     -> "${n / 1_000}K"
    else           -> n.toString()
}
