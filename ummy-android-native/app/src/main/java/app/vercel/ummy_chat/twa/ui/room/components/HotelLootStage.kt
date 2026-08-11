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
fun HotelLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "hotel")
    
    val floatAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )

    val pulseAnim by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1700, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val beamPulseAnim by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beam"
    )

    val auraRotateAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(16000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "aura"
    )

    // Gradients
    val hotelHullGrad = Brush.linearGradient(
        colors = listOf(Color(0xFF1E1B4B), Color(0xFF311042), Color(0xFF030712)),
        start = Offset(0f, 0f), end = Offset(400f, 400f)
    )

    // Paths
    val tower1f = remember { PathParser().parsePathString("M100 320 L150 295 L150 160 L100 185 Z").toPath() }
    val tower1r = remember { PathParser().parsePathString("M150 295 L200 320 L200 185 L150 160 Z").toPath() }
    
    val tower2f = remember { PathParser().parsePathString("M200 320 L250 295 L250 160 L200 185 Z").toPath() }
    val tower2r = remember { PathParser().parsePathString("M250 295 L300 320 L300 185 L250 160 Z").toPath() }

    val mainTowerf = remember { PathParser().parsePathString("M140 310 L200 280 L260 310 L260 90 L200 60 L140 90 Z").toPath() }
    val mainTowerr = remember { PathParser().parsePathString("M200 280 L260 310 L260 90 L200 60 Z").toPath() }

    val balcony1 = remember { PathParser().parsePathString("M152 140 L200 115 L248 140").toPath() }
    val balcony2 = remember { PathParser().parsePathString("M152 200 L200 175 L248 200").toPath() }
    val balcony3 = remember { PathParser().parsePathString("M152 260 L200 235 L248 260").toPath() }

    val roof = remember { PathParser().parsePathString("M140 90 L200 60 L260 90 L200 108 Z").toPath() }
    val radarDish = remember { PathParser().parsePathString("M195 80 L205 80 L200 68 Z").toPath() }

    val laser1 = remember { PathParser().parsePathString("M200 84 L80 0 L120 0 Z").toPath() }
    val laser2 = remember { PathParser().parsePathString("M200 84 L320 0 L280 0 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(340.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.85f, 0.85f)
                translate(30f, 30f)
            }) {
                // Base shadow
                drawOval(color = Color(0x99000000), topLeft = Offset(200f - 150f, 350f - 22f), size = Size(300f, 44f))

                // Under-pedestal glow
                drawOval(color = Color(0xFFEC4899), topLeft = Offset(200f - 170f, 350f - 30f), size = Size(340f, 60f), style = Stroke(width = 2.5f))
                drawOval(color = Color(0xFF00F3FF), topLeft = Offset(200f - 120f, 350f - 18f), size = Size(240f, 36f), style = Stroke(width = 1.5f))

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(200f, 200f))
                    translate(0f, -14f * floatAnim)
                }) {
                    // Tower 1 (Left)
                    withTransform({ translate(-10f, 20f) }) {
                        drawPath(tower1f, brush = hotelHullGrad)
                        drawPath(tower1f, color = Color(0xFFEC4899), style = Stroke(width = 1f))
                        drawPath(tower1r, color = Color(0xFF030712))
                        drawPath(tower1r, color = Color(0xFFEC4899), style = Stroke(width = 1f))

                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(112f, 200f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(128f, 200f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(162f, 195f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(178f, 195f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))

                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(112f, 235f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(128f, 235f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(162f, 230f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(178f, 230f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))

                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(112f, 270f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(162f, 265f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                    }

                    // Tower 2 (Right)
                    withTransform({ translate(10f, 20f) }) {
                        drawPath(tower2f, brush = hotelHullGrad)
                        drawPath(tower2f, color = Color(0xFF00F3FF), style = Stroke(width = 1f))
                        drawPath(tower2r, color = Color(0xFF030712))
                        drawPath(tower2r, color = Color(0xFF00F3FF), style = Stroke(width = 1f))

                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(212f, 195f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(262f, 200f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(278f, 200f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))

                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(212f, 230f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(262f, 235f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(278f, 235f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))

                        drawRoundRect(Color(0xFF00F3FF).copy(alpha = 0.8f), topLeft = Offset(212f, 265f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                        drawRoundRect(Color(0xFFEC4899).copy(alpha = 0.9f), topLeft = Offset(262f, 270f), size = Size(8f, 15f), cornerRadius = CornerRadius(1f, 1f))
                    }

                    // Main Penthouse
                    drawPath(mainTowerf, brush = hotelHullGrad)
                    drawPath(mainTowerf, color = Color(0xFF00F3FF), style = Stroke(width = 2.5f))
                    drawPath(mainTowerr, color = Color(0xFF030712))
                    drawPath(mainTowerr, color = Color(0xFFEC4899), style = Stroke(width = 1.5f))

                    // Center neon line
                    drawLine(Color(0xFF00F3FF), start = Offset(200f, 60f), end = Offset(200f, 280f), strokeWidth = 3f)

                    // Balconies
                    drawPath(balcony1, color = Color(0xFFEC4899), style = Stroke(width = 2f, join = StrokeJoin.Round))
                    drawPath(balcony2, color = Color(0xFF00F3FF), style = Stroke(width = 2.5f, join = StrokeJoin.Round))
                    drawPath(balcony3, color = Color(0xFFEC4899), style = Stroke(width = 2f, join = StrokeJoin.Round))

                    // Signboard
                    drawRoundRect(Color(0xFF020617), topLeft = Offset(162f, 102f), size = Size(76f, 24f), cornerRadius = CornerRadius(4f, 4f))
                    drawRoundRect(Color(0xFFEC4899), topLeft = Offset(162f, 102f), size = Size(76f, 24f), cornerRadius = CornerRadius(4f, 4f), style = Stroke(width = 2f))
                    // Simplified "HOTEL" Text representation
                    drawLine(Color(0xFF00F3FF), start = Offset(175f, 114f), end = Offset(225f, 114f), strokeWidth = 2f)
                    
                    // Crown Roof
                    drawPath(roof, color = Color(0xFF1E1B4B))
                    drawPath(roof, color = Color(0xFF00F3FF), style = Stroke(width = 2.5f))
                    
                    // Helipad
                    drawOval(Color(0xFFEC4899), topLeft = Offset(165f, 72f), size = Size(70f, 24f), style = Stroke(width = 2f))
                    drawLine(Color.White, start = Offset(195f, 82f), end = Offset(195f, 88f), strokeWidth = 1.5f)
                    drawLine(Color.White, start = Offset(205f, 82f), end = Offset(205f, 88f), strokeWidth = 1.5f)
                    drawLine(Color.White, start = Offset(195f, 85f), end = Offset(205f, 85f), strokeWidth = 1.5f)

                    // Scanner Laser
                    val scannerY = 92f + (198f * beamPulseAnim)
                    drawLine(Color(0xFF00F3FF).copy(alpha = 0.8f), start = Offset(144f, scannerY), end = Offset(256f, scannerY), strokeWidth = 2f)

                    // Radar Dish
                    withTransform({
                        rotate(auraRotateAnim, Offset(200f, 84f))
                    }) {
                        drawPath(radarDish, color = Color(0xFFEC4899))
                        drawPath(radarDish, color = Color(0xFF00F3FF), style = Stroke(width = 0.8f))
                        drawCircle(Color(0xFF00F3FF), radius = 2.5f, center = Offset(200f, 68f))
                    }

                    // Volumetric search lasers
                    drawPath(laser1, color = Color(0x2E00F3FF))
                    drawPath(laser2, color = Color(0x26EC4899))
                }
            }
        }
    }
}
