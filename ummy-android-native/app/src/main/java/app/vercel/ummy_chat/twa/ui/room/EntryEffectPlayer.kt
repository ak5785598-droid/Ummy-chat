package app.vercel.ummy_chat.twa.ui.room

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.ViewGroup
import android.widget.VideoView
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.data.model.EntryEffect
import coil.compose.AsyncImage
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ─────────────────────────────────────────────────────────────────────────────
// EntryEffectPlayer — mirrors RN entry-effect-player.tsx
// Video effects (line/lion/dragon): fullscreen video + golden pill bottom
// Non-video (slide/fade/bounce): top slide-in pill with avatar
// ─────────────────────────────────────────────────────────────────────────────

private fun vibrateShort(context: Context) {
    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(100)
    }
}

@Composable
fun EntryEffectPlayer(effect: EntryEffect, onComplete: () -> Unit) {
    val context = LocalContext.current
    val isVideoEffect = effect.effectType == "line" || effect.effectType == "lion" || effect.effectType == "dragon"

    LaunchedEffect(effect) {
        if (effect.hasEnteringSound) {
            try {
                val defaultSoundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
                val mediaPlayer = android.media.MediaPlayer.create(context, defaultSoundUri)
                mediaPlayer?.setOnCompletionListener { mp -> mp.release() }
                mediaPlayer?.start()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        vibrateShort(context)
    }

    if (isVideoEffect) {
        EntryVideoEffectPlayer(effect = effect, onComplete = onComplete)
    } else {
        EntrySlideEffectPlayer(effect = effect, onComplete = onComplete)
    }
}

// ── Video effects: line / lion / dragon ──────────────────────────────────────

@Composable
private fun EntryVideoEffectPlayer(effect: EntryEffect, onComplete: () -> Unit) {
    val context = LocalContext.current

    val videoUri = remember(effect.videoUrl) {
        when {
            !effect.videoUrl.isNullOrBlank() -> Uri.parse(effect.videoUrl)
            else -> Uri.parse("android.resource://${context.packageName}/${R.raw.entry_line}")
        }
    }

    // RN: playAsync() after 100ms + 10s safety timeout
    LaunchedEffect(effect) {
        delay(100)
        delay(10_000)
        onComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 100.dp)
    ) {
        AndroidView(
            factory = { ctx ->
                VideoView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setOnCompletionListener { onComplete() }
                    setVideoURI(videoUri)
                    start()
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Bottom golden pill — RN: bottom:40, rgba(0,0,0,0.75), radius 24,
        // border rgba(255,215,0,0.4), avatar 32 with 2px #FFD700 border
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 40.dp)
                .background(Color(0xBF000000), RoundedCornerShape(24.dp))
                .border(1.dp, Color(0x66FFD700), RoundedCornerShape(24.dp))
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!effect.avatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = effect.avatarUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .border(2.dp, Color(0xFFFFD700), CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFB8860B)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("\u2B50", fontSize = 16.sp)
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "${effect.username.ifBlank { "VIP" }} entered!",
                color = Color(0xFFFFD700),
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }
    }
}

// ── Non-video effects: slide / fade / bounce ─────────────────────────────────

@Composable
private fun EntrySlideEffectPlayer(effect: EntryEffect, onComplete: () -> Unit) {
    val slideAnim = remember(effect) { Animatable(-100f) }
    val opacity = remember(effect) { Animatable(0f) }

    LaunchedEffect(effect) {
        // RN: spring to 0 (bounce: friction 3/tension 60, else friction 6/tension 40)
        // + opacity 0->1 (300ms), hold 2500ms, slide out +100 (400ms) + fade (400ms)
        val springSpec = if (effect.effectType == "bounce") {
            spring<Float>(dampingRatio = 0.3f, stiffness = 200f)
        } else {
            spring<Float>(dampingRatio = 0.55f, stiffness = 100f)
        }
        coroutineScope {
            launch {
                opacity.animateTo(1f, tween(300))
            }
            launch {
                slideAnim.animateTo(0f, springSpec)
            }
        }
        delay(2500)
        coroutineScope {
            launch {
                slideAnim.animateTo(100f, tween(400))
            }
            launch {
                opacity.animateTo(0f, tween(400))
            }
        }
        onComplete()
    }

    val borderWhite = Color(0x1AFFFFFF)      // rgba(255,255,255,0.1)
    val cyan = Color(0xFF22D3EE)
    val cyanBorder = Color(0x8022D3EE)       // rgba(34,211,238,0.5)
    val whiteBorder = Color(0x4DFFFFFF)      // rgba(255,255,255,0.3)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 80.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Row(
            modifier = Modifier
                .graphicsLayer {
                    translationX = slideAnim.value
                    alpha = opacity.value
                }
                .background(Color(0x99000000), RoundedCornerShape(999.dp))
                .border(1.dp, borderWhite, RoundedCornerShape(999.dp))
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!effect.mediaUrl.isNullOrBlank()) {
                AsyncImage(
                    model = effect.mediaUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .border(1.dp, cyanBorder, CircleShape)
                )
            } else if (!effect.avatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = effect.avatarUrl,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .border(1.dp, whiteBorder, CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF7C3AED)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "U",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "${effect.username.ifBlank { "Someone" }} entered",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                if (!effect.mediaUrl.isNullOrBlank()) {
                    Text(
                        text = "Entry effect",
                        color = cyan,
                        fontSize = 8.sp
                    )
                }
            }
        }
    }
}
