package app.vercel.ummy_chat.twa.ui.families

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

// ─── Family clan emoji symbols ──────────────────────────────────────────
private val CLAN_SYMBOLS = listOf("⚔️", "🛡️", "👑", "🏆", "⭐", "🔥", "💎", "🦅", "✦", "❋")

@Composable
fun FamilyBackground() {
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val widthPx = with(density) { configuration.screenWidthDp.dp.toPx() }
    val heightPx = with(density) { configuration.screenHeightDp.dp.toPx() }

    val infiniteTransition = rememberInfiniteTransition(label = "FamilyBG")

    // Glow Orbs
    val glowA = infiniteTransition.animateFloat(
        initialValue = 0.9f, targetValue = 1.12f,
        animationSpec = infiniteRepeatable(tween(3000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glowA"
    )
    val glowB = infiniteTransition.animateFloat(
        initialValue = 0.88f, targetValue = 1.1f,
        animationSpec = infiniteRepeatable(tween(3000, delayMillis = 1500, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glowB"
    )
    val glowC = infiniteTransition.animateFloat(
        initialValue = 0.92f, targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(2400, delayMillis = 900, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glowC"
    )

    // Auroras
    val aurora1 = infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(3800, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "aurora1"
    )
    val aurora2 = infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(4200, delayMillis = 1900, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "aurora2"
    )
    val aurora3 = infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(3200, delayMillis = 3000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "aurora3"
    )

    // Shimmer sweep
    val shimmerX = infiniteTransition.animateFloat(
        initialValue = -120f, targetValue = widthPx + 120f,
        animationSpec = infiniteRepeatable(tween(3500, delayMillis = 600, easing = LinearEasing), RepeatMode.Restart), label = "shimmer"
    )

    // Crown pulse
    val crownPulse = infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 1.15f,
        animationSpec = infiniteRepeatable(tween(700, delayMillis = 1200, easing = LinearOutSlowInEasing), RepeatMode.Reverse), label = "crownPulse"
    )

    // Twinkling stars
    val stars = remember {
        List(45) {
            val anim = Animatable(0f)
            val delay = Random.nextLong(4000)
            object {
                val animObj = anim
                val delayMs = delay
                val x = Random.nextFloat() * widthPx
                val y = Random.nextFloat() * heightPx * 0.9f
                val size = 1f + Random.nextFloat() * 2.5f
                val color = if (it % 5 == 0) Color(0xFFFBBF24) else if (it % 3 == 0) Color(0xFFA78BFA) else Color(0xB3FFFFFF)
            }
        }
    }

    // Floating clan symbols
    val symbols = remember {
        List(18) {
            val anim = Animatable(0f)
            val drift = Animatable(0f)
            val delay = Random.nextLong(5000)
            val duration = 6000L + Random.nextLong(4000)
            object {
                val animObj = anim
                val driftObj = drift
                val delayMs = delay
                val durMs = duration
                val x = 10f + Random.nextFloat() * (widthPx - 30f)
                val char = CLAN_SYMBOLS[it % CLAN_SYMBOLS.size]
                val size = 12f + Random.nextFloat() * 14f
                val isRotPos = (it % 2 == 0)
            }
        }
    }

    // Gold sparks
    val sparks = remember {
        List(20) {
            val anim = Animatable(0f)
            val delay = Random.nextLong(3000)
            object {
                val animObj = anim
                val delayMs = delay
                val x = Random.nextFloat() * widthPx
                val y = Random.nextFloat() * heightPx
                val size = 2f + Random.nextFloat() * 4f
                val color = if (it % 3 == 0) Color(0xFFFBBF24) else if (it % 3 == 1) Color(0xFF6366F1) else Color(0xFF10B981)
            }
        }
    }

    LaunchedEffect(Unit) {
        stars.forEach { s ->
            launch {
                delay(s.delayMs)
                while (isActive) {
                    s.animObj.animateTo(1f, tween(800))
                    s.animObj.animateTo(0.15f, tween(800))
                }
            }
        }
        symbols.forEach { p ->
            launch {
                delay(p.delayMs)
                while (isActive) {
                    p.animObj.snapTo(0f)
                    p.driftObj.snapTo(0f)
                    launch {
                        p.animObj.animateTo(1f, tween(p.durMs.toInt(), easing = LinearOutSlowInEasing))
                    }
                    val driftIterations = Math.ceil(p.durMs.toDouble() / 2800).toInt()
                    launch {
                        repeat(driftIterations) {
                            p.driftObj.animateTo(1f, tween(1400, easing = FastOutSlowInEasing))
                            p.driftObj.animateTo(-1f, tween(1400, easing = FastOutSlowInEasing))
                        }
                    }
                    delay(p.durMs)
                }
            }
        }
        sparks.forEach { s ->
            launch {
                delay(s.delayMs)
                while (isActive) {
                    s.animObj.animateTo(1f, tween(900))
                    s.animObj.animateTo(0f, tween(900))
                    delay(1000L + Random.nextLong(2000))
                }
            }
        }
    }

    val textMeasurer = rememberTextMeasurer()

    Box(modifier = Modifier.fillMaxSize()) {
        // Base & overlay gradients
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF03000F), Color(0xFF080118), Color(0xFF0F0228), Color(0xFF080118), Color(0xFF03000F))
                )
            )
        )
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.linearGradient(
                    colors = listOf(Color.Transparent, Color(0x1A6366F1), Color(0x1EA855F7), Color(0x0FFBBF24), Color.Transparent)
                )
            )
        )

        Canvas(modifier = Modifier.fillMaxSize()) {
            val h = size.height
            val w = size.width

            // Auroras (Simplified as linear gradients with varying scale/opacity)
            val drawAurora = { topOffset: Float, scaleVal: Float, opacityVal: Float, colors: List<Color> ->
                translate(top = topOffset) {
                    val aScale = 0.7f + scaleVal * 0.5f // Range roughly 0.7 to 1.2
                    translate(top = -50f * aScale) {
                        drawRect(
                            brush = Brush.horizontalGradient(colors),
                            size = Size(w + 60f, 100f * aScale),
                            topLeft = Offset(-30f, 0f),
                            alpha = opacityVal
                        )
                    }
                }
            }
            
            drawAurora(h * 0.15f, aurora1.value, 0.25f + 0.25f * aurora1.value, listOf(Color(0x006366F1), Color(0x476366F1), Color(0x38A855F7), Color(0x006366F1)))
            drawAurora(h * 0.42f, aurora2.value, 0.2f + 0.25f * aurora2.value, listOf(Color(0x00FBBF24), Color(0x2EFBBF24), Color(0x38F59E0B), Color(0x00FBBF24)))
            drawAurora(h * 0.68f, aurora3.value, 0.2f + 0.2f * aurora3.value, listOf(Color(0x0010B981), Color(0x2E10B981), Color(0x2434D399), Color(0x0010B981)))
            drawAurora(h * 0.83f, aurora1.value, 0.25f + 0.25f * aurora1.value, listOf(Color(0x00A855F7), Color(0x33A855F7), Color(0x296366F1), Color(0x00A855F7)))

            // Glow Orbs
            val drawOrb = { cx: Float, cy: Float, radius: Float, scale: Float, colors: List<Color> ->
                drawCircle(
                    brush = Brush.radialGradient(colors = colors, center = Offset(cx, cy), radius = radius * scale),
                    radius = radius * scale,
                    center = Offset(cx, cy)
                )
            }
            drawOrb(w / 2f, -100f, 130f, glowA.value, listOf(Color(0x8C6366F1), Color.Transparent))
            drawOrb(w + 80f, h + 80f, 125f, glowB.value, listOf(Color(0x73FBBF24), Color.Transparent))
            drawOrb(-70f, h * 0.4f, 90f, glowC.value, listOf(Color(0x6610B981), Color.Transparent))
            drawOrb(w + 50f, h * 0.1f, 80f, glowA.value, listOf(Color(0x6BA855F7), Color.Transparent))
            drawOrb(-40f, h * 0.8f, 70f, glowB.value, listOf(Color(0x59F59E0B), Color.Transparent))

            // Stars
            stars.forEach { s ->
                val op = s.animObj.value
                val sc = 0.5f + op * 0.9f
                drawCircle(color = s.color, radius = (s.size / 2f) * sc, center = Offset(s.x, s.y), alpha = op)
            }

            // Sparks
            sparks.forEach { sp ->
                val prog = sp.animObj.value
                val op = if (prog < 0.5f) prog * 2f else (1f - prog) * 2f
                val sc = if (prog < 0.5f) 0.3f + prog * 2.2f else 1.4f - (prog - 0.5f) * 2.2f
                drawCircle(color = sp.color, radius = (sp.size / 2f) * sc, center = Offset(sp.x, sp.y), alpha = op)
            }

            // Symbols
            symbols.forEach { p ->
                val prog = p.animObj.value
                val ty = -(h * 0.8f) * prog
                val op = when {
                    prog < 0.06f -> prog / 0.06f * 0.8f
                    prog < 0.85f -> 0.8f - ((prog - 0.06f) / 0.79f) * 0.35f
                    else -> 0.45f - ((prog - 0.85f) / 0.15f) * 0.45f
                }
                val dx = p.driftObj.value * 16f
                val rot = prog * 180f * (if (p.isRotPos) 1 else -1)
                
                translate(left = p.x + dx, top = h + 10f + ty) {
                    rotate(degrees = rot) {
                        drawText(
                            textMeasurer = textMeasurer,
                            text = p.char,
                            style = TextStyle(fontSize = p.size.sp, color = Color.White.copy(alpha = op)),
                            topLeft = Offset(-p.size / 2f, -p.size / 2f)
                        )
                    }
                }
            }
        }

        // Shimmer diagonal sweep
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(100.dp)
                .offset(x = with(density) { shimmerX.value.toDp() })
                .graphicsLayer(rotationZ = -22f)
                .background(Color(0x06FFFFFF))
        )


        // Royal crest glow (Smaller Size)
        Box(
            modifier = Modifier
                .offset(
                    x = 10.dp,
                    y = with(density) { (heightPx * 0.06f).toDp() }
                )
                .align(Alignment.TopCenter)
                .graphicsLayer(scaleX = crownPulse.value, scaleY = crownPulse.value),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0x1FFBBF24))
                    .border(1.dp, Color(0x59FBBF24), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("👑", fontSize = 14.sp)
            }
        }

        // Vignettes
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.5f)
                .align(Alignment.BottomCenter)
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x9903000F))))
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.12f)
                .align(Alignment.TopCenter)
                .background(Brush.verticalGradient(listOf(Color(0x8003000F), Color.Transparent)))
        )
    }
}
