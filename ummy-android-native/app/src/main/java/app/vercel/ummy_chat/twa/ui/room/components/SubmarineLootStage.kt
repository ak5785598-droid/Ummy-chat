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
fun SubmarineLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "submarine")
    
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
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "aura"
    )

    val beamPulseAnim by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beam"
    )

    // Gradients
    val refSubHull = Brush.verticalGradient(
        colors = listOf(Color(0xFF2E3033), Color(0xFF1E2022), Color(0xFF0F1011)),
        startY = 0f, endY = 350f
    )
    val refYellowGrad = Brush.verticalGradient(
        colors = listOf(Color(0xFFFACC15), Color(0xFFCA8A04)),
        startY = 0f, endY = 350f
    )
    val refCockpitGlass = Brush.verticalGradient(
        colors = listOf(Color(0xFF38BDF8), Color(0xFF0369A1)),
        startY = 0f, endY = 350f
    )

    // Paths
    val tailFinV = remember { PathParser().parsePathString("M420 160 L490 80 H515 L480 180 Z").toPath() }
    val tailFinVYellow = remember { PathParser().parsePathString("M470 120 L495 90 H505 L480 130 Z").toPath() }
    val tailFinH1 = remember { PathParser().parsePathString("M460 215 L530 230 L520 240 L450 220 Z").toPath() }
    val tailFinH2 = remember { PathParser().parsePathString("M460 175 L530 160 L520 150 L450 170 Z").toPath() }

    val hull = remember { PathParser().parsePathString("M160 170 C160 120 220 115 440 145 C485 150 510 170 500 205 C480 235 380 255 210 245 C175 240 160 210 160 170 Z").toPath() }
    val seam1 = remember { PathParser().parsePathString("M220 130 C220 170 210 210 205 242").toPath() }
    val seam2 = remember { PathParser().parsePathString("M280 135 C285 170 280 210 270 245").toPath() }
    val seam3 = remember { PathParser().parsePathString("M340 140 C345 170 342 210 330 248").toPath() }
    val seam4 = remember { PathParser().parsePathString("M400 145 C405 175 402 210 390 250").toPath() }

    val yellowGuard1 = remember { PathParser().parsePathString("M225 244 C270 248 370 250 420 245 L415 253 C365 258 270 256 220 248 Z").toPath() }
    val yellowGuard2 = remember { PathParser().parsePathString("M190 225 L210 246 L200 250 L180 228 Z").toPath() }

    val noseCollar = remember { PathParser().parsePathString("M160 170 C160 138 185 130 205 130 C195 160 195 190 205 215 C185 215 160 202 160 170 Z").toPath() }
    val noseCone = remember { PathParser().parsePathString("M142 170 C142 148 152 142 165 142 C165 160 165 180 165 198 C152 198 142 192 142 170 Z").toPath() }

    val tower1 = remember { PathParser().parsePathString("M295 138 L305 90 H375 L385 142 Z").toPath() }
    val tower2 = remember { PathParser().parsePathString("M305 90 H375 V102 H307 Z").toPath() }
    val towerGlass = remember { PathParser().parsePathString("M298 125 L310 96 H330 L322 130 Z").toPath() }
    val towerStripe = remember { PathParser().parsePathString("M352 108 H372 V124 H350 Z").toPath() }

    val deltaWing = remember { PathParser().parsePathString("M260 195 L370 205 L350 230 L250 215 Z").toPath() }
    val deltaWingTip = remember { PathParser().parsePathString("M350 203 L370 205 L365 212 L347 210 Z").toPath() }

    val thrusterFront1 = remember { PathParser().parsePathString("M10 160 C5 160 2 166 2 173 C2 180 5 186 10 186 Z").toPath() }
    val thrusterFront2 = remember { PathParser().parsePathString("M10 165 C6 165 3 170 3 175 C3 180 6 185 10 185 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(340.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.56f, 0.56f) // Fit 600x350 into 340x340
                translate(0f, 60f)
            }) {
                // Bubbles
                val bubbleY1 = 290f - (290f - 80f) * auraRotateAnim
                drawCircle(color = Color.White.copy(alpha = 0.4f), radius = 4f, center = Offset(150f, bubbleY1))
                drawCircle(color = Color(0xFF38BDF8), radius = 4f, center = Offset(150f, bubbleY1), style = Stroke(width = 0.8f))

                val bubbleY2 = 320f - (320f - 100f) * auraRotateAnim
                drawCircle(color = Color.White.copy(alpha = 0.35f), radius = 6f, center = Offset(210f, bubbleY2))
                drawCircle(color = Color(0xFF38BDF8), radius = 6f, center = Offset(210f, bubbleY2), style = Stroke(width = 1f))

                val bubbleY3 = 270f - (270f - 60f) * auraRotateAnim
                drawCircle(color = Color.White.copy(alpha = 0.45f), radius = 5f, center = Offset(380f, bubbleY3))
                drawCircle(color = Color(0xFF38BDF8), radius = 5f, center = Offset(380f, bubbleY3), style = Stroke(width = 0.8f))

                // Pedestal
                drawOval(color = Color(0xA6000000), topLeft = Offset(300f - 160f, 275f - 12f), size = Size(320f, 24f))
                drawOval(color = Color(0x66FACC15), topLeft = Offset(300f - 190f, 275f - 22f), size = Size(380f, 44f), style = Stroke(width = 1.5f))

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(300f, 175f))
                    translate(0f, -10f * floatAnim)
                }) {
                    // Back Propulsion
                    withTransform({ translate(500f, 180f) }) {
                        drawRect(color = Color(0xFF1F2937), topLeft = Offset(0f, -4f), size = Size(20f, 8f))
                        withTransform({ rotate(auraRotateAnim * 360f, Offset(20f, 0f)) }) {
                            drawOval(color = Color(0xFFCA8A04), topLeft = Offset(20f - 4f, 0f - 25f), size = Size(8f, 50f))
                            drawOval(color = Color(0xFFFACC15), topLeft = Offset(20f - 4f, 0f - 25f), size = Size(8f, 50f), style = Stroke(width = 1f))

                            drawOval(color = Color(0xFFCA8A04), topLeft = Offset(20f - 25f, 0f - 4f), size = Size(50f, 8f))
                            drawOval(color = Color(0xFFFACC15), topLeft = Offset(20f - 25f, 0f - 4f), size = Size(50f, 8f), style = Stroke(width = 1f))
                        }
                    }

                    drawPath(tailFinV, color = Color(0xFF1E2022))
                    drawPath(tailFinV, color = Color(0xFFFACC15), style = Stroke(width = 1.5f))
                    drawPath(tailFinVYellow, brush = refYellowGrad)

                    drawPath(tailFinH1, color = Color(0xFF0F1011))
                    drawPath(tailFinH1, color = Color(0xFFFACC15), style = Stroke(width = 1f))
                    drawPath(tailFinH2, color = Color(0xFF0F1011))
                    drawPath(tailFinH2, color = Color(0xFFFACC15), style = Stroke(width = 1f))

                    // Hull
                    drawPath(hull, brush = refSubHull)
                    drawPath(hull, color = Color(0xFF374151), style = Stroke(width = 2.5f))

                    drawPath(seam1, color = Color(0xFF4B5563), style = Stroke(width = 1.5f))
                    drawPath(seam2, color = Color(0xFF4B5563), style = Stroke(width = 1.5f))
                    drawPath(seam3, color = Color(0xFF4B5563), style = Stroke(width = 1.5f))
                    drawPath(seam4, color = Color(0xFF4B5563), style = Stroke(width = 1.5f))

                    drawPath(yellowGuard1, brush = refYellowGrad)
                    drawPath(yellowGuard2, brush = refYellowGrad)
                    drawPath(yellowGuard2, color = Color(0xFF1E2022), style = Stroke(width = 1f))

                    drawPath(noseCollar, brush = refYellowGrad)
                    drawPath(noseCollar, color = Color(0xFF1E2022), style = Stroke(width = 1.5f))
                    
                    drawPath(noseCone, color = Color(0xFF1E2022))
                    
                    drawOval(color = Color(0xFF030712), topLeft = Offset(144f - 6f, 170f - 14f), size = Size(12f, 28f))
                    drawOval(color = Color(0xFFFACC15), topLeft = Offset(144f - 6f, 170f - 14f), size = Size(12f, 28f), style = Stroke(width = 1.5f))
                    drawOval(color = Color.Black, topLeft = Offset(144f - 3f, 170f - 8f), size = Size(6f, 16f))

                    // Bridge Tower
                    drawPath(tower1, brush = refSubHull)
                    drawPath(tower1, color = Color(0xFF4B5563), style = Stroke(width = 2f))
                    drawPath(tower2, color = Color(0xFF0F1011))
                    drawPath(tower2, color = Color(0xFFFACC15), style = Stroke(width = 1f))

                    drawPath(towerGlass, brush = refCockpitGlass)
                    drawPath(towerGlass, color = Color(0xFF38BDF8), style = Stroke(width = 1.2f))
                    drawLine(Color.White.copy(alpha = 0.5f), start = Offset(302f, 120f), end = Offset(311f, 100f), strokeWidth = 2f)

                    drawPath(towerStripe, brush = refYellowGrad)

                    // Antennas
                    drawLine(Color(0xFF4B5563), start = Offset(318f, 90f), end = Offset(318f, 40f), strokeWidth = 3.2f)
                    drawCircle(color = Color(0xFFFACC15), radius = 2.5f, center = Offset(318f, 40f))

                    drawLine(Color(0xFF1F2937), start = Offset(334f, 90f), end = Offset(334f, 30f), strokeWidth = 2.8f)

                    drawLine(Color(0xFF4B5563), start = Offset(345f, 90f), end = Offset(345f, 20f), strokeWidth = 4f)
                    val blinkR = 2f + (3.5f * beamPulseAnim)
                    drawCircle(color = Color(0xFFEF4444), radius = blinkR, center = Offset(345f, 20f))

                    drawLine(Color(0xFF1F2937), start = Offset(358f, 90f), end = Offset(358f, 35f), strokeWidth = 2.5f)

                    // Delta Wings
                    drawPath(deltaWing, color = Color(0xFF1E2022))
                    drawPath(deltaWing, color = Color(0xFF4B5563), style = Stroke(width = 1.5f))
                    drawPath(deltaWingTip, brush = refYellowGrad)
                    drawLine(Color(0xFFFACC15), start = Offset(280f, 202f), end = Offset(330f, 207f), strokeWidth = 2f)

                    // Thrusters
                    withTransform({ translate(195f, 30f) }) {
                        drawRoundRect(brush = refYellowGrad, topLeft = Offset(10f, 160f), size = Size(75f, 26f), cornerRadius = CornerRadius(6f, 6f))
                        drawRoundRect(color = Color(0xFF1E2022), topLeft = Offset(10f, 160f), size = Size(75f, 26f), cornerRadius = CornerRadius(6f, 6f), style = Stroke(width = 2f))
                        
                        drawPath(thrusterFront1, color = Color(0xFF0F1011))
                        drawPath(thrusterFront1, color = Color(0xFFFACC15), style = Stroke(width = 1f))
                        drawCircle(color = Color.Black, radius = 3.5f, center = Offset(6f, 173f))

                        drawRoundRect(color = Color(0xFF1E2022), topLeft = Offset(80f, 163f), size = Size(8f, 20f), cornerRadius = CornerRadius(2f, 2f))
                    }

                    withTransform({ translate(90f, 50f) }) {
                        drawRoundRect(brush = refYellowGrad, topLeft = Offset(10f, 165f), size = Size(65f, 20f), cornerRadius = CornerRadius(5f, 5f))
                        drawRoundRect(color = Color(0xFF1E2022), topLeft = Offset(10f, 165f), size = Size(65f, 20f), cornerRadius = CornerRadius(5f, 5f), style = Stroke(width = 1.8f))
                        
                        drawPath(thrusterFront2, color = Color(0xFF0F1011))
                        drawPath(thrusterFront2, color = Color(0xFFFACC15), style = Stroke(width = 1f))
                        drawCircle(color = Color.Black, radius = 2.5f, center = Offset(6f, 175f))

                        drawRoundRect(color = Color(0xFF1E2022), topLeft = Offset(70f, 168f), size = Size(6f, 14f), cornerRadius = CornerRadius(2f, 2f))
                    }

                    // LEDs
                    drawCircle(color = Color(0xFF22C55E), radius = 3.5f, center = Offset(218f, 150f))
                    drawCircle(color = Color(0xFFEF4444).copy(alpha = 0.8f), radius = 3.5f, center = Offset(240f, 152f))
                }
            }
        }
    }
}
