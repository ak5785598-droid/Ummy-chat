package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

data class Particle(
    val x: Float,
    val char: String,
    val size: Float,
    val delayMs: Long,
    val durationMs: Int
)

data class SparkDot(
    val x: Float,
    val y: Float,
    val size: Float,
    val delayMs: Long
)

@Composable
fun CpHouseBackground(mode: String = "cp") {
    val config = LocalConfiguration.current
    val density = LocalDensity.current
    val screenWidth = with(density) { config.screenWidthDp.dp.toPx() }
    val screenHeight = with(density) { config.screenHeightDp.dp.toPx() }

    val isCp = mode == "cp"

    // Colors
    val baseColors = if (isCp) listOf(Color(0xFF0A0018), Color(0xFF18002E), Color(0xFF280040), Color(0xFF18002E), Color(0xFF0A0018))
    else listOf(Color(0xFF000D1A), Color(0xFF001A33), Color(0xFF001F3F), Color(0xFF001A33), Color(0xFF000D1A))

    val midColors = if (isCp) listOf(Color.Transparent, Color(0x1EF43F5E), Color(0x23A855F7), Color.Transparent)
    else listOf(Color.Transparent, Color(0x1E0EA5E9), Color(0x2322D3EE), Color.Transparent)

    val orbAColor = if (isCp) Color(0x80F43F5E) else Color(0x800EA5E9)
    val orbBColor = if (isCp) Color(0x8C8B5CF6) else Color(0x8022D3EE)
    val orbCColor = if (isCp) Color(0x66EC4899) else Color(0x666366F1)

    // Animations
    val infiniteTransition = rememberInfiniteTransition()

    val glowA by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.12f,
        animationSpec = infiniteRepeatable(
            animation = tween(2600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    val glowB by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2600, easing = LinearEasing, delayMillis = 1300),
            repeatMode = RepeatMode.Reverse
        )
    )

    val rotateMain by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(baseColors))) {
        Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(midColors)))

        Canvas(modifier = Modifier.fillMaxSize()) {
            // Glow Orbs
            drawCircle(
                brush = Brush.radialGradient(listOf(orbAColor, Color.Transparent), center = Offset(size.width / 2, -90f), radius = 120f * glowA),
                center = Offset(size.width / 2, -90f),
                radius = 120f * glowA
            )
            drawCircle(
                brush = Brush.radialGradient(listOf(orbBColor, Color.Transparent), center = Offset(size.width + 80f, size.height + 80f), radius = 130f * glowB),
                center = Offset(size.width + 80f, size.height + 80f),
                radius = 130f * glowB
            )
            drawCircle(
                brush = Brush.radialGradient(listOf(orbCColor, Color.Transparent), center = Offset(-70f, size.height * 0.38f), radius = 90f * glowA),
                center = Offset(-70f, size.height * 0.38f),
                radius = 90f * glowA
            )
            
            // Rotating Rings
            val ringColor1 = if (isCp) Color(0x14F43F5E) else Color(0x140EA5E9)
            val ringColor2 = if (isCp) Color(0x1A8B5CF6) else Color(0x1A22D3EE)
            
            withTransform({
                translate(left = size.width / 2, top = size.height * 0.45f)
                rotate(rotateMain)
            }) {
                drawCircle(ringColor1, radius = size.width * 0.6f, style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 20f))))
            }
            
            withTransform({
                translate(left = size.width / 2, top = size.height * 0.35f)
                rotate(-rotateMain)
            }) {
                drawCircle(ringColor2, radius = size.width * 0.4f, style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(15f, 15f))))
            }
        }
        
        // Petals & Sparks logic can be added later if performance allows. For now Canvas handles main aesthetic.
    }
}
