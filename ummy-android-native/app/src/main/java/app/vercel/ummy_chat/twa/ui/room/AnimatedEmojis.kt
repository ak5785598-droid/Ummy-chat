package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedEmojis — mirrors RN 9 animated emoji files + mount overlay
// Full collection of seat animated reaction effects & entry mounts
// ─────────────────────────────────────────────────────────────────────────────

enum class AnimatedEmojiType(val emoji: String, val label: String) {
    ANGRY("😡", "Angry"),
    CRY("😭", "Cry"),
    FRUSTRATION("😤", "Frustration"),
    IRRITATION("😠", "Irritated"),
    LOVE_HANDSHAKE("🤝❤️", "Love Handshake"),
    LOVE_SHOW("💕", "Love Show"),
    RUN("🏃", "Run"),
    THINKING("🤔", "Thinking"),
    WRITING("✍️", "Writing")
}

@Composable
fun AnimatedEmojiSeatEffect(
    visible: Boolean,
    type: AnimatedEmojiType,
    onComplete: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    if (!visible) return

    val scaleAnim = remember { Animatable(0f) }
    val alphaAnim = remember { Animatable(0f) }

    val infiniteTransition = rememberInfiniteTransition(label = "emoji_wobble")
    val wobbleAngle by infiniteTransition.animateFloat(
        initialValue = -10f, targetValue = 10f,
        animationSpec = infiniteRepeatable(tween(300), RepeatMode.Reverse),
        label = "wobble"
    )
    val floatY by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = -8f,
        animationSpec = infiniteRepeatable(tween(500), RepeatMode.Reverse),
        label = "float"
    )

    LaunchedEffect(visible, type) {
        if (!visible) return@LaunchedEffect
        scaleAnim.snapTo(0f); alphaAnim.snapTo(0f)
        scaleAnim.animateTo(1.2f, spring(dampingRatio = 0.4f, stiffness = 300f))
        alphaAnim.animateTo(1f, tween(150))
        delay(2200)
        alphaAnim.animateTo(0f, tween(300))
        scaleAnim.animateTo(0.4f, tween(300))
        onComplete?.invoke()
    }

    Box(
        modifier = modifier
            .size(56.dp)
            .graphicsLayer {
                scaleX = scaleAnim.value
                scaleY = scaleAnim.value
                rotationZ = wobbleAngle
                translationY = floatY
                alpha = alphaAnim.value
            },
        contentAlignment = Alignment.Center
    ) {
        Text(type.emoji, fontSize = 36.sp)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MountOverlay — mirrors RN mount-overlay.tsx
// User room entry vehicle / mount banner animation overlay
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun MountOverlay(
    visible: Boolean,
    userName: String = "User",
    mountName: String = "Dragon Mount",
    mountEmoji: String = "🐉",
    onComplete: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    if (!visible) return

    val slideAnim = remember { Animatable(-300f) }
    val alphaAnim = remember { Animatable(0f) }

    LaunchedEffect(visible) {
        slideAnim.snapTo(-300f); alphaAnim.snapTo(0f)
        alphaAnim.animateTo(1f, tween(200))
        slideAnim.animateTo(0f, spring(dampingRatio = 0.6f, stiffness = 120f))
        delay(3000)
        slideAnim.animateTo(300f, tween(400))
        alphaAnim.animateTo(0f, tween(400))
        onComplete?.invoke()
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 80.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Row(
            modifier = Modifier
                .graphicsLayer {
                    translationX = slideAnim.value
                    alpha = alphaAnim.value
                }
                .clip(RoundedCornerShape(99.dp))
                .background(
                    Brush.horizontalGradient(
                        listOf(Color(0xFF7C3AED), Color(0xFFEC4899), Color(0xFFF59E0B))
                    )
                )
                .border(1.5.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(99.dp))
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(mountEmoji, fontSize = 24.sp)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(
                    "$userName entered with $mountName",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    "VIP ARRIVAL",
                    color = Color(0xFFFBBF24),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
