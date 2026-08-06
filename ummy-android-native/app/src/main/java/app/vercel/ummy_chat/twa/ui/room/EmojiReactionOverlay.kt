package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

// ─────────────────────────────────────────────────────────────────────────────
// EmojiReactionOverlay — mirrors RN emoji-reaction-overlay.tsx
// Animated floating/wobbling emoji on a seat (spring-in → float → wobble → fade)
// pointerEvents: none (overlaid on seat, passes through taps)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun EmojiReactionOverlay(
    emoji: String?,
    visible: Boolean,
    customEmojiUrl: String? = null,
    size: Int = 28,
    noAnimation: Boolean = false,
    zoom: Float = 1.2f,
    onComplete: (() -> Unit)? = null
) {
    if (!visible || emoji == null) return

    // Animate scale — spring in then idle
    val animatable = remember { Animatable(0f) }
    val alphaAnim = remember { Animatable(0f) }

    val floatAnim = rememberInfiniteTransition(label = "float")
    val floatY by floatAnim.animateFloat(
        initialValue = 0f, targetValue = if (noAnimation) 0f else -6f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "floatY"
    )
    val wobble by floatAnim.animateFloat(
        initialValue = 0f, targetValue = if (noAnimation) 0f else 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(400), repeatMode = RepeatMode.Reverse
        ), label = "wobble"
    )

    LaunchedEffect(visible, emoji) {
        if (!visible || emoji == null) return@LaunchedEffect
        // Spring in
        animatable.snapTo(0f); alphaAnim.snapTo(0f)
        animatable.animateTo(1.3f, animationSpec = spring(dampingRatio = 0.4f, stiffness = 300f))
        alphaAnim.animateTo(1f, animationSpec = tween(120))
        if (!noAnimation) {
            kotlinx.coroutines.delay(2200)
            alphaAnim.animateTo(0f, animationSpec = tween(350))
            animatable.animateTo(0.3f, animationSpec = tween(350))
            onComplete?.invoke()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer {
                scaleX = animatable.value
                scaleY = animatable.value
                translationY = floatY
                rotationZ = wobble
                alpha = alphaAnim.value
            },
        contentAlignment = Alignment.Center
    ) {
        if (customEmojiUrl != null) {
            AsyncImage(
                model = customEmojiUrl,
                contentDescription = emoji,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize(zoom)
            )
        } else {
            Text(emoji, fontSize = size.sp)
        }
    }
}
