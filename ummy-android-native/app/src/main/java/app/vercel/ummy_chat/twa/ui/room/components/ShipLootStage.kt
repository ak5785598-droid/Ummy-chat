package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

@Composable
fun ShipLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "ship")
    
    val pulseAnim by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1700, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val floatAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )

    val auraRotateAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing), // Slowed down from React Native for better visual flow
            repeatMode = RepeatMode.Restart
        ),
        label = "aura"
    )

    val beamPulseAnim by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beam"
    )

    // Gradients
    val shipHull = Brush.verticalGradient(
        colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617)),
        startY = 0f, endY = 300f
    )
    val shipChrome = Brush.linearGradient(
        colors = listOf(Color(0xFF38BDF8), Color(0xFF0284C7), Color(0xFF0369A1)),
        start = Offset(0f, 0f), end = Offset(600f, 0f)
    )

    // Paths
    val wake1a = remember { PathParser().parsePathString("M60 255 Q300 295 540 255 Q300 315 60 255").toPath() }
    val wake1b = remember { PathParser().parsePathString("M60 255 Q300 315 540 255 Q300 280 60 255").toPath() }
    
    val wake2a = remember { PathParser().parsePathString("M40 262 Q300 280 560 262").toPath() }
    val wake2b = remember { PathParser().parsePathString("M40 262 Q300 310 560 262").toPath() }
    
    val wake3a = remember { PathParser().parsePathString("M90 268 Q300 305 510 268").toPath() }
    val wake3b = remember { PathParser().parsePathString("M90 268 Q300 280 510 268").toPath() }

    val hull1 = remember { PathParser().parsePathString("M80 200 L120 150 L480 150 L520 200 L440 240 H160 Z").toPath() }
    val hull2 = remember { PathParser().parsePathString("M160 240 H440 L400 250 H200 Z").toPath() }
    val decal = remember { PathParser().parsePathString("M150 170 H450 L470 200 H130 Z").toPath() }
    
    val bridge = remember { PathParser().parsePathString("M220 150 L240 115 H360 L380 150 Z").toPath() }
    val bridgeWin = remember { PathParser().parsePathString("M255 123 L345 123 L335 140 L265 140 Z").toPath() }

    val radarWave1 = remember { PathParser().parsePathString("M280 60 Q300 50 320 60").toPath() }
    val radarWave2 = remember { PathParser().parsePathString("M270 50 Q300 35 330 50").toPath() }

    Box(modifier = Modifier.width(340.dp).height(280.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.56f, 0.56f) // Fit 600x300 into 340x280
                translate(0f, 60f)
            }) {
                // Base Water Glow
                drawOval(color = Color(0x2600F3FF), topLeft = Offset(300f - 230f, 260f - 25f), size = Size(460f, 50f))
                
                // Animated Wakes
                val phase = if (auraRotateAnim < 0.5f) auraRotateAnim * 2 else (1f - auraRotateAnim) * 2 // ping pong 0 -> 1 -> 0

                // In a real scenario we could do path interpolation, but here we can draw overlapping fades or just use a fixed path if needed.
                // We will simulate the movement by blending
                drawPath(wake1a, color = Color(0x9900F3FF).copy(alpha = 0.6f * (1f - phase)))
                drawPath(wake1b, color = Color(0x9900F3FF).copy(alpha = 0.6f * phase))

                drawPath(wake2a, color = Color(0xFFEE00FF), style = Stroke(width = 4.5f), alpha = 1f - phase)
                drawPath(wake2b, color = Color(0xFFEE00FF), style = Stroke(width = 4.5f), alpha = phase)

                drawPath(wake3a, color = Color(0xFF00F3FF), style = Stroke(width = 3f), alpha = 1f - phase)
                drawPath(wake3b, color = Color(0xFF00F3FF), style = Stroke(width = 3f), alpha = phase)

                // Shadow
                drawOval(color = Color(0x99000000), topLeft = Offset(300f - 200f, 252f - 12f), size = Size(400f, 24f))

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(300f, 150f))
                    translate(0f, -10f * floatAnim)
                }) {
                    // Hull
                    drawPath(hull1, brush = shipHull)
                    drawPath(hull1, color = Color(0xFF00F3FF), style = Stroke(width = 2f))
                    
                    drawPath(hull2, color = Color(0xFF020617))
                    drawPath(hull2, color = Color(0xFF00F3FF), style = Stroke(width = 1f))

                    drawPath(decal, brush = shipChrome, alpha = 0.8f)

                    // Windows
                    for (x in listOf(200f, 250f, 300f, 350f)) {
                        drawRoundRect(color = Color(0xFFFBBF24), topLeft = Offset(x, 178f), size = Size(25f, 12f), androidx.compose.ui.geometry.CornerRadius(2f, 2f))
                        drawRoundRect(color = Color(0xFFFBBF24), topLeft = Offset(x, 178f), size = Size(25f, 12f), androidx.compose.ui.geometry.CornerRadius(2f, 2f), style = Stroke(width = 1f))
                    }

                    drawLine(Color(0xFFF43F5E), start = Offset(120f, 160f), end = Offset(480f, 160f), strokeWidth = 2.5f)
                    drawLine(Color(0xFF00F3FF), start = Offset(140f, 210f), end = Offset(460f, 210f), strokeWidth = 1.5f)

                    // Bridge
                    drawPath(bridge, color = Color(0xFF0F172A))
                    drawPath(bridge, color = Color(0xFF00F3FF), style = Stroke(width = 1.8f))
                    drawPath(bridgeWin, color = Color(0xE600F3FF))

                    // Radar Tower
                    drawLine(Color(0xFF475569), start = Offset(300f, 115f), end = Offset(300f, 70f), strokeWidth = 3f)

                    withTransform({
                        rotate(auraRotateAnim * 360f, Offset(300f, 70f))
                    }) {
                        drawOval(color = Color(0xFF334155), topLeft = Offset(300f - 18f, 70f - 5f), size = Size(36f, 10f))
                        drawOval(color = Color(0xFF00F3FF), topLeft = Offset(300f - 18f, 70f - 5f), size = Size(36f, 10f), style = Stroke(width = 1.2f))
                        drawLine(Color(0xFF00F3FF), start = Offset(285f, 70f), end = Offset(315f, 70f), strokeWidth = 2f)
                    }

                    // Radar Waves
                    drawPath(radarWave1, color = Color(0xFF00F3FF), style = Stroke(width = 2f))
                    drawPath(radarWave2, color = Color(0x9900F3FF), style = Stroke(width = 1f))

                    // Beacons
                    val r = 2f + (3f * beamPulseAnim)
                    drawCircle(color = Color(0xFFEF4444), radius = r, center = Offset(120f, 150f))
                    drawCircle(color = Color(0xFF10B981), radius = r, center = Offset(480f, 150f))
                }
            }
        }
    }
}
