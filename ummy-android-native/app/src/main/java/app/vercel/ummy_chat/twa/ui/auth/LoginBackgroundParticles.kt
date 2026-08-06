package app.vercel.ummy_chat.twa.ui.auth

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.asComposePath
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.core.graphics.PathParser
import kotlin.random.Random

// ============================================================
// React Native components/LoginBackground.tsx → Kotlin (1-to-1)
// Source: src/components/LoginBackground.tsx (110 lines)
// 25 particles: music-note #d946ef, heart #f472b6, star #fbbf24
// ============================================================

private const val MUSIC_NOTE_PATH =
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
private const val HEART_PATH =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
private const val STAR_PATH =
    "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"

private val PARTICLE_COLORS = listOf(
    Color(0xFFD946EF), // music-note
    Color(0xFFF472B6), // heart
    Color(0xFFFBBF24)  // star
)

private data class LoginParticle(
    val id: Int,
    val type: Int,
    val xPercent: Float,
    val yPercent: Float,
    val size: Float,
    val opacity: Float,
    val rotation: Float
)

@Composable
fun LoginBackgroundParticles() {
    val particles = remember {
        // React Native L22-35: types[i % 3], x/y Math.random()*100,
        // size 20 + Math.random()*40, opacity 0.3 + Math.random()*0.5,
        // rotation Math.random()*360
        (0 until 25).map { index ->
            LoginParticle(
                id = index,
                type = index % 3,
                xPercent = Random.nextFloat() * 100f,
                yPercent = Random.nextFloat() * 100f,
                size = 20f + Random.nextFloat() * 40f,
                opacity = 0.3f + Random.nextFloat() * 0.5f,
                rotation = Random.nextFloat() * 360f
            )
        }
    }

    val pathData = remember {
        // SVG 24x24 viewBox paths → Compose Path (React Native L40-56)
        arrayOf(
            PathParser.createPathFromPathData(MUSIC_NOTE_PATH).asComposePath(),
            PathParser.createPathFromPathData(HEART_PATH).asComposePath(),
            PathParser.createPathFromPathData(STAR_PATH).asComposePath()
        )
    }

    // React Native L158-166: floatAnim = loop [timing(1, 3000ms), timing(0, 3000ms)]
    val infiniteTransition = rememberInfiniteTransition(label = "ParticleFloat")
    val floatAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "Float"
    )

    val floatPx = with(LocalDensity.current) { -30.dp.toPx() } // translateY 0 → -30

    Box(modifier = Modifier.fillMaxSize()) {
        // 1. Radial Glossy Overlay (React Native L78-87): bg rgba(176,39,255,0.2)
        //    opacity interpolate [0,1] → [0.3, 0.7]
        Box(
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.3f + floatAnim * 0.4f)
                .background(Color(0xFFB027FF).copy(alpha = 0.2f))
        )

        // 2. 25 Floating Particles (React Native L89-107)
        Canvas(modifier = Modifier.fillMaxSize()) {
            particles.forEach { p ->
                val x = p.xPercent / 100f * size.width
                val y = p.yPercent / 100f * size.height + floatAnim * floatPx
                val path = pathData[p.type]
                withTransform({
                    translate(left = x, top = y)
                    // Scale 24x24 viewBox → particle size, rotate about center
                    scale(p.size / 24f, p.size / 24f, pivot = Offset.Zero)
                    rotate(p.rotation, pivot = Offset(p.size / 2f, p.size / 2f))
                }) {
                    drawPath(path, PARTICLE_COLORS[p.type].copy(alpha = p.opacity))
                }
            }
        }
    }
}
