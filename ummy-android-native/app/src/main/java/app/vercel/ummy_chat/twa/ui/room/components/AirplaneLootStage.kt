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
fun AirplaneLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "plane")
    
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
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "aura"
    )

    val beamPulseAnim by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(150, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beam"
    )

    // Gradients
    val refPlaneHull = Brush.verticalGradient(
        colors = listOf(Color(0xFF2A2B2E), Color(0xFF18191C), Color(0xFF08090A)),
        startY = 0f, endY = 350f
    )
    val refGoldDecal = Brush.verticalGradient(
        colors = listOf(Color(0xFFFACC15), Color(0xFFD97706)),
        startY = 0f, endY = 350f
    )
    val refJetGlass = Brush.linearGradient(
        colors = listOf(Color(0xE6E0F2FE), Color(0xA67DD3FC), Color(0xE60284C7)),
        start = Offset(0f, 0f), end = Offset(600f, 350f)
    )
    val refEngineFire = Brush.linearGradient(
        colors = listOf(Color(0xFFFF4500), Color(0xFFFACC15), Color.Transparent),
        start = Offset(0f, 0f), end = Offset(600f, 0f) // Simplified to L->R
    )

    // Paths
    val fire1a = remember { PathParser().parsePathString("M120 180 L-10 190 L120 190 Z").toPath() }
    val fire1b = remember { PathParser().parsePathString("M120 180 L-60 190 L120 190 Z").toPath() }
    
    val fire2a = remember { PathParser().parsePathString("M120 200 L-10 190 L120 190 Z").toPath() }
    val fire2b = remember { PathParser().parsePathString("M120 200 L-60 190 L120 190 Z").toPath() }

    val wingBottom = remember { PathParser().parsePathString("M240 225 L100 320 H180 L350 220 Z").toPath() }
    val wingBottomGold = remember { PathParser().parsePathString("M120 310 L180 320 H160 L100 320 Z").toPath() }

    val wingTop = remember { PathParser().parsePathString("M240 165 L100 70 H180 L350 170 Z").toPath() }
    val wingTopGold = remember { PathParser().parsePathString("M120 80 L180 70 H160 L100 70 Z").toPath() }

    val body = remember { PathParser().parsePathString("M530 205 C420 155 350 148 200 150 H120 L95 175 L95 215 L120 240 H200 C350 242 420 235 530 205 Z").toPath() }
    
    val glass = remember { PathParser().parsePathString("M375 162 C405 158 450 162 472 196 C435 204 395 200 375 162 Z").toPath() }
    val glassSpec = remember { PathParser().parsePathString("M382 168 A 18 18 0 0 1 435 180").toPath() }

    val tailTop = remember { PathParser().parsePathString("M150 150 L80 60 L110 150 Z").toPath() }
    val tailBottom = remember { PathParser().parsePathString("M150 240 L80 330 L110 240 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(340.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.56f, 0.56f) // Fit 600x350 into 340x340
                translate(0f, 60f)
            }) {
                // Streaks
                val streak1X1 = 650f - (100f - -100f) * auraRotateAnim
                val streak1X2 = 750f - (100f - -100f) * auraRotateAnim
                drawLine(Color(0xFF38BDF8).copy(alpha = 0.6f), start = Offset(streak1X1, 80f), end = Offset(streak1X2, 80f), strokeWidth = 1.5f)

                val streak2X1 = 550f - (100f - -100f) * auraRotateAnim
                val streak2X2 = 650f - (100f - -100f) * auraRotateAnim
                drawLine(Color.White.copy(alpha = 0.4f), start = Offset(streak2X1, 280f), end = Offset(streak2X2, 280f), strokeWidth = 2f)

                val streak3X1 = 700f - (100f - -100f) * auraRotateAnim
                val streak3X2 = 800f - (100f - -100f) * auraRotateAnim
                drawLine(Color(0xFFE879F9).copy(alpha = 0.5f), start = Offset(streak3X1, 190f), end = Offset(streak3X2, 190f), strokeWidth = 1.5f)

                // Shadow
                drawOval(color = Color(0x99000000), topLeft = Offset(300f - 180f, 275f - 12f), size = Size(360f, 24f))
                drawOval(color = Color(0x4DFACC15), topLeft = Offset(300f - 200f, 275f - 24f), size = Size(400f, 48f), style = Stroke(width = 1.5f))

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(300f, 175f))
                    translate(0f, -14f * floatAnim)
                }) {
                    // Engines
                    val phase = (beamPulseAnim - 0.4f) / 0.6f // normalize to 0..1
                    drawPath(fire1a, brush = refEngineFire, alpha = 1f - phase)
                    drawPath(fire1b, brush = refEngineFire, alpha = phase)
                    
                    drawPath(fire2a, brush = refEngineFire, alpha = 1f - phase)
                    drawPath(fire2b, brush = refEngineFire, alpha = phase)

                    // Wings
                    drawPath(wingBottom, color = Color(0xFF18191C))
                    drawPath(wingBottom, color = Color(0xFF374151), style = Stroke(width = 1.5f))
                    drawPath(wingBottomGold, brush = refGoldDecal)
                    drawLine(Color(0xFFFACC15), start = Offset(220f, 230f), end = Offset(150f, 285f), strokeWidth = 2.2f)

                    drawPath(wingTop, color = Color(0xFF08090A))
                    drawPath(wingTop, color = Color(0xFF374151), style = Stroke(width = 1.5f))
                    drawPath(wingTopGold, brush = refGoldDecal)
                    drawLine(Color(0xFFFACC15), start = Offset(220f, 160f), end = Offset(150f, 105f), strokeWidth = 2.2f)

                    // Body
                    drawPath(body, brush = refPlaneHull)
                    drawPath(body, color = Color(0xFF4B5563), style = Stroke(width = 2f))

                    // Glass
                    drawPath(glass, brush = refJetGlass)
                    drawPath(glass, color = Color(0xFF38BDF8), style = Stroke(width = 1.5f))
                    drawPath(glassSpec, color = Color(0xA6FFFFFF), style = Stroke(width = 2.5f))

                    // Trims
                    drawLine(Color(0xFFFACC15), start = Offset(480f, 195f), end = Offset(520f, 202f), strokeWidth = 2f)
                    drawLine(Color(0xFFFACC15), start = Offset(455f, 198f), end = Offset(495f, 204f), strokeWidth = 1.8f)

                    // Engine Cylinders
                    withTransform({ translate(180f, 105f) }) {
                        drawRoundRect(color = Color(0xFF18191C), topLeft = Offset(0f, 0f), size = Size(70f, 28f), androidx.compose.ui.geometry.CornerRadius(6f, 6f))
                        drawRoundRect(color = Color(0xFF4B5563), topLeft = Offset(0f, 0f), size = Size(70f, 28f), androidx.compose.ui.geometry.CornerRadius(6f, 6f), style = Stroke(width = 1.5f))
                        drawOval(color = Color(0xFF08090A), topLeft = Offset(70f - 4f, 14f - 12f), size = Size(8f, 24f))
                        drawOval(color = Color(0xFFFACC15), topLeft = Offset(70f - 4f, 14f - 12f), size = Size(8f, 24f), style = Stroke(width = 2f))
                        drawOval(color = Color.Black, topLeft = Offset(70f - 2f, 14f - 7f), size = Size(4f, 14f))
                        drawLine(Color(0xFFFACC15), start = Offset(10f, 22f), end = Offset(50f, 22f), strokeWidth = 1.5f)
                    }

                    withTransform({ translate(180f, 218f) }) {
                        drawRoundRect(color = Color(0xFF18191C), topLeft = Offset(0f, 0f), size = Size(70f, 28f), androidx.compose.ui.geometry.CornerRadius(6f, 6f))
                        drawRoundRect(color = Color(0xFF4B5563), topLeft = Offset(0f, 0f), size = Size(70f, 28f), androidx.compose.ui.geometry.CornerRadius(6f, 6f), style = Stroke(width = 1.5f))
                        drawOval(color = Color(0xFF08090A), topLeft = Offset(70f - 4f, 14f - 12f), size = Size(8f, 24f))
                        drawOval(color = Color(0xFFFACC15), topLeft = Offset(70f - 4f, 14f - 12f), size = Size(8f, 24f), style = Stroke(width = 2f))
                        drawOval(color = Color.Black, topLeft = Offset(70f - 2f, 14f - 7f), size = Size(4f, 14f))
                        drawLine(Color(0xFFFACC15), start = Offset(10f, 6f), end = Offset(50f, 6f), strokeWidth = 1.5f)
                    }

                    // Tails
                    drawPath(tailTop, color = Color(0xFF2A2B2E))
                    drawPath(tailTop, color = Color(0xFFFACC15), style = Stroke(width = 1.2f))
                    drawPath(tailBottom, color = Color(0xFF18191C))
                    drawPath(tailBottom, color = Color(0xFFFACC15), style = Stroke(width = 1.2f))

                    // Decals
                    drawLine(Color(0xFFFACC15), start = Offset(100f, 70f), end = Offset(60f, 70f), strokeWidth = 2.5f)
                    drawLine(Color(0xFFFACC15), start = Offset(100f, 320f), end = Offset(60f, 320f), strokeWidth = 2.5f)
                }
            }
        }
    }
}
