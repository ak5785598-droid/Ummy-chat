package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

@Composable
fun BusLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "bus")
    
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
            animation = tween(400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "aura"
    )

    // Gradients
    val busBody = Brush.verticalGradient(
        colors = listOf(Color(0xFF1E1B4B), Color(0xFF4C1D95), Color(0xFF2E1065), Color(0xFF0F172A)),
        startY = 0f, endY = 300f
    )
    val busGlass = Brush.verticalGradient(
        colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF312E81)),
        startY = 0f, endY = 200f
    )
    val busMagentaNeon = Brush.linearGradient(
        colors = listOf(Color(0xFFEC4899), Color(0xFFBE185D)),
        start = Offset(0f, 0f), end = Offset(600f, 0f)
    )
    val busCyanNeon = Brush.verticalGradient(
        colors = listOf(Color(0xFF00F3FF), Color(0xFF008BB8)),
        startY = 0f, endY = 100f
    )

    // Paths
    val lowerDeck = remember { PathParser().parsePathString("M100 230 H480 V150 L470 110 H110 L100 150 Z").toPath() }
    val upperDeck = remember { PathParser().parsePathString("M110 110 H470 V45 C470 40 450 35 430 35 H150 C130 35 110 40 110 45 Z").toPath() }
    val chromeStrip = remember { PathParser().parsePathString("M98 135 H482 L478 143 H102 Z").toPath() }
    
    val upWin1 = remember { PathParser().parsePathString("M130 50 H200 V95 H130 Z").toPath() }
    val upWin2 = remember { PathParser().parsePathString("M220 50 H290 V95 H220 Z").toPath() }
    val upWin3 = remember { PathParser().parsePathString("M310 50 H380 V95 H310 Z").toPath() }
    val upWin4 = remember { PathParser().parsePathString("M400 50 H450 V95 H400 Z").toPath() }

    val loWin1 = remember { PathParser().parsePathString("M130 155 H200 V195 H130 Z").toPath() }
    val loWin2 = remember { PathParser().parsePathString("M220 155 H290 V195 H220 Z").toPath() }
    val loWin3 = remember { PathParser().parsePathString("M310 155 H380 V195 H310 Z").toPath() }
    
    val cockpit = remember { PathParser().parsePathString("M430 155 C430 155 460 155 472 168 L478 190 H430 Z").toPath() }

    val headlights = remember { PathParser().parsePathString("M480 210 L520 180 L520 240 L480 225 Z").toPath() }
    val tailLights = remember { PathParser().parsePathString("M98 200 H103 V220 H98 Z").toPath() }

    val spoiler1 = remember { PathParser().parsePathString("M100 40 L85 30 L95 55 Z").toPath() }
    val spoiler2 = remember { PathParser().parsePathString("M480 40 L495 30 L485 55 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(280.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.56f, 0.56f) // Scale 600x300 down to fit 340x280
                translate(0f, 60f)
            }) {
                // Shadow & Glow
                drawOval(color = Color(0xCC000000), topLeft = Offset(300f - 220f, 270f - 15f), size = Size(440f, 30f))
                drawOval(color = Color(0x5900F3FF), topLeft = Offset(300f - 160f, 270f - 8f), size = Size(320f, 16f))

                // Road Marks
                val dashX1 = 650f - (600f * auraRotateAnim)
                val dashX2 = 600f - (600f * auraRotateAnim)
                drawLine(Color(0xFF00F3FF).copy(alpha = 0.65f), start = Offset(dashX1, 274f), end = Offset(dashX2, 274f), strokeWidth = 3f)
                
                val dash2X1 = 350f - (600f * auraRotateAnim)
                val dash2X2 = 300f - (600f * auraRotateAnim)
                drawLine(Color(0xFF00F3FF).copy(alpha = 0.65f), start = Offset(dash2X1, 274f), end = Offset(dash2X2, 274f), strokeWidth = 3f)

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(300f, 150f))
                    translate(0f, -10f * floatAnim)
                }) {
                    // Front Wheel
                    withTransform({ translate(170f, 245f) }) {
                        drawOval(color = Color(0x99000000), topLeft = Offset(-35f, 20f - 8f), size = Size(70f, 16f))
                        drawCircle(color = Color(0xFF090D16), radius = 32f)
                        drawCircle(color = Color(0xFF2A2F3D), radius = 32f, style = Stroke(width = 3f))
                        drawCircle(color = Color.Transparent, radius = 28f, style = Stroke(width = 1f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 3f))))

                        withTransform({ rotate(auraRotateAnim * 360f) }) {
                            drawCircle(color = Color(0xFF475569), radius = 22f)
                            drawCircle(color = Color(0xFF94A3B8), radius = 22f, style = Stroke(width = 2f))
                            drawLine(Color(0xFFCBD5E1), start = Offset(-22f, 0f), end = Offset(22f, 0f), strokeWidth = 3f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(0f, -22f), end = Offset(0f, 22f), strokeWidth = 3f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(-15f, -15f), end = Offset(15f, 15f), strokeWidth = 2f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(-15f, 15f), end = Offset(15f, -15f), strokeWidth = 2f)
                            drawCircle(color = Color(0xFF1E293B), radius = 8f)
                            drawCircle(color = Color(0xFFFBBF24), radius = 4f)
                        }
                    }

                    // Rear Wheel
                    withTransform({ translate(410f, 245f) }) {
                        drawOval(color = Color(0x99000000), topLeft = Offset(-35f, 20f - 8f), size = Size(70f, 16f))
                        drawCircle(color = Color(0xFF090D16), radius = 32f)
                        drawCircle(color = Color(0xFF2A2F3D), radius = 32f, style = Stroke(width = 3f))
                        drawCircle(color = Color.Transparent, radius = 28f, style = Stroke(width = 1f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 3f))))

                        withTransform({ rotate(auraRotateAnim * 360f) }) {
                            drawCircle(color = Color(0xFF475569), radius = 22f)
                            drawCircle(color = Color(0xFF94A3B8), radius = 22f, style = Stroke(width = 2f))
                            drawLine(Color(0xFFCBD5E1), start = Offset(-22f, 0f), end = Offset(22f, 0f), strokeWidth = 3f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(0f, -22f), end = Offset(0f, 22f), strokeWidth = 3f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(-15f, -15f), end = Offset(15f, 15f), strokeWidth = 2f)
                            drawLine(Color(0xFFCBD5E1), start = Offset(-15f, 15f), end = Offset(15f, -15f), strokeWidth = 2f)
                            drawCircle(color = Color(0xFF1E293B), radius = 8f)
                            drawCircle(color = Color(0xFFFBBF24), radius = 4f)
                        }
                    }

                    // Body
                    drawPath(lowerDeck, brush = busBody)
                    drawPath(lowerDeck, color = Color(0xFFEC4899), style = Stroke(width = 2f))
                    
                    drawPath(upperDeck, brush = busBody)
                    drawPath(upperDeck, color = Color(0xFF00F3FF), style = Stroke(width = 2.2f))

                    drawPath(chromeStrip, brush = busMagentaNeon, alpha = 0.9f)

                    // Windows
                    drawPath(upWin1, brush = busGlass)
                    drawPath(upWin1, color = Color(0xFF00F3FF), style = Stroke(width = 1f))
                    drawLine(Color.White.copy(alpha = 0.15f), start = Offset(135f, 55f), end = Offset(160f, 90f), strokeWidth = 1.5f)

                    drawPath(upWin2, brush = busGlass)
                    drawPath(upWin2, color = Color(0xFF00F3FF), style = Stroke(width = 1f))
                    drawPath(upWin3, brush = busGlass)
                    drawPath(upWin3, color = Color(0xFF00F3FF), style = Stroke(width = 1f))
                    drawPath(upWin4, brush = busGlass)
                    drawPath(upWin4, color = Color(0xFF00F3FF), style = Stroke(width = 1f))

                    drawPath(loWin1, brush = busGlass)
                    drawPath(loWin1, color = Color(0xFFEC4899), style = Stroke(width = 1f))
                    drawPath(loWin2, brush = busGlass)
                    drawPath(loWin2, color = Color(0xFFEC4899), style = Stroke(width = 1f))
                    drawPath(loWin3, brush = busGlass)
                    drawPath(loWin3, color = Color(0xFFEC4899), style = Stroke(width = 1f))

                    drawPath(cockpit, brush = busGlass)
                    drawPath(cockpit, color = Color(0xFF00F3FF), style = Stroke(width = 1.5f))

                    // Destination Board
                    drawRoundRect(color = Color.Black, topLeft = Offset(210f, 112f), size = Size(180f, 20f), cornerRadius = CornerRadius(5f, 5f))
                    drawRoundRect(color = Color(0xFF00F3FF), topLeft = Offset(210f, 112f), size = Size(180f, 20f), cornerRadius = CornerRadius(5f, 5f), style = Stroke(width = 1f))
                    drawLine(Color(0xFFFBBF24), start = Offset(260f, 126f), end = Offset(340f, 126f), strokeWidth = 2f) // Fake text

                    // Lights
                    drawPath(headlights, color = Color(0x6600F3FF))
                    drawCircle(color = Color.White, radius = 8f, center = Offset(480f, 217f))
                    drawCircle(color = Color(0xFF00F3FF), radius = 8f, center = Offset(480f, 217f), style = Stroke(width = 2f))

                    drawPath(tailLights, color = Color(0xFFEF4444))

                    // Spoilers
                    drawPath(spoiler1, brush = busMagentaNeon)
                    drawPath(spoiler2, brush = busCyanNeon)
                }
            }
        }
    }
}
