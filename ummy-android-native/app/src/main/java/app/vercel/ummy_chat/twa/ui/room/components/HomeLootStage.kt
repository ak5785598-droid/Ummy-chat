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
fun HomeLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "home")
    
    val floatAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )

    val orbitAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbit"
    )

    val lightningAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutLinearInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "lightning"
    )

    // Gradients
    val baseTop = Brush.linearGradient(
        colors = listOf(Color(0xFF2E0854), Color(0xFF090014)),
        start = Offset(0f, 0f), end = Offset(100f, 100f)
    )
    val baseSide = Brush.verticalGradient(
        colors = listOf(Color(0xFF4C1D95), Color(0xFF0F051D)),
        startY = 269f, endY = 362f
    )
    val wallF = Brush.verticalGradient(
        colors = listOf(Color(0xFFFFE699), Color(0xFFD4AF37), Color(0xFFAA7C11), Color(0xFF543C08)),
        startY = 18f, endY = 252f
    )
    val wallR = Brush.verticalGradient(
        colors = listOf(Color(0xFFCA8A04), Color(0xFF451A03)),
        startY = 18f, endY = 252f
    )
    val roofGrad = Brush.linearGradient(
        colors = listOf(Color(0xFFF472B6), Color(0xFFD946EF), Color(0xFF701A75)),
        start = Offset(0f, 0f), end = Offset(200f, 200f)
    )

    // Paths
    val moonPath = remember { PathParser().parsePathString("M312 30 A 20 20 0 1 0 336 54 A 16 16 0 1 1 312 30 Z").toPath() }
    val baseTopPath = remember { PathParser().parsePathString("M58 269 L195 198 L334 269 L195 342 Z").toPath() }
    val baseSideLeft = remember { PathParser().parsePathString("M58 269 L195 342 L195 362 L58 290 Z").toPath() }
    val baseSideRight = remember { PathParser().parsePathString("M334 269 L195 342 L195 362 L334 290 Z").toPath() }
    val baseHighlight1 = remember { PathParser().parsePathString("M83 269 L195 212 L309 269 L195 329 Z").toPath() }
    val baseHighlight2 = remember { PathParser().parsePathString("M101 270 L195 224 L291 270 L195 319 Z").toPath() }

    val t1Front = remember { PathParser().parsePathString("M104 205 L104 142 L195 95 L195 252 Z").toPath() }
    val t1Right = remember { PathParser().parsePathString("M195 95 L286 142 L286 205 L195 252 Z").toPath() }
    val t1Roof = remember { PathParser().parsePathString("M104 142 L195 95 L286 142 L195 190 Z").toPath() }

    val t2Front = remember { PathParser().parsePathString("M134 141 L134 94 L195 63 L195 170 Z").toPath() }
    val t2Right = remember { PathParser().parsePathString("M195 63 L256 94 L256 141 L195 170 Z").toPath() }
    val t2Roof = remember { PathParser().parsePathString("M134 94 L195 63 L256 94 L195 128 Z").toPath() }

    val t3Front = remember { PathParser().parsePathString("M173 78 L173 36 L210 18 L210 97 Z").toPath() }
    val t3Right = remember { PathParser().parsePathString("M210 18 L248 38 L248 78 L210 97 Z").toPath() }
    val t3Roof = remember { PathParser().parsePathString("M173 36 L210 18 L248 38 L210 58 Z").toPath() }

    val lwFront = remember { PathParser().parsePathString("M78 223 L78 173 L124 150 L124 242 Z").toPath() }
    val lwRight = remember { PathParser().parsePathString("M124 150 L164 171 L164 222 L124 242 Z").toPath() }
    val lwRoof = remember { PathParser().parsePathString("M78 173 L124 150 L164 171 L118 197 Z").toPath() }

    val rwRoof = remember { PathParser().parsePathString("M226 171 L266 150 L312 173 L266 197 Z").toPath() }
    val rwFront = remember { PathParser().parsePathString("M226 171 L226 222 L266 242 L266 197 Z").toPath() }
    val rwRight = remember { PathParser().parsePathString("M266 197 L312 173 L312 223 L266 242 Z").toPath() }
    
    val balcony = remember { PathParser().parsePathString("M162 183 L195 165 L228 183 L195 201 Z").toPath() }
    val lightning1 = remember { PathParser().parsePathString("M 60 10 L 85 80 L 70 95 L 110 160 L 95 168 L 120 220").toPath() }
    val lightning2 = remember { PathParser().parsePathString("M 330 15 L 305 90 L 318 105 L 285 180 L 298 190 L 275 250").toPath() }

    val leftTowerFront = remember { PathParser().parsePathString("M82 198 L82 116 L121 96 L121 219 Z").toPath() }
    val leftTowerRight = remember { PathParser().parsePathString("M121 96 L153 113 L153 197 L121 219 Z").toPath() }
    val leftTowerRoof = remember { PathParser().parsePathString("M82 116 L121 96 L153 113 L114 135 Z").toPath() }

    val rightTowerRoof = remember { PathParser().parsePathString("M237 113 L269 96 L308 116 L269 135 Z").toPath() }
    val rightTowerFront = remember { PathParser().parsePathString("M237 113 L237 197 L269 219 L269 135 Z").toPath() }
    val rightTowerRight = remember { PathParser().parsePathString("M269 135 L308 116 L308 198 L269 219 Z").toPath() }

    val gate1 = remember { PathParser().parsePathString("M169 224 L195 210 L221 224 L195 238 Z").toPath() }
    val gate2 = remember { PathParser().parsePathString("M170 224 L195 211 L195 238 L170 251 Z").toPath() }
    val gate3 = remember { PathParser().parsePathString("M195 211 L220 224 L220 251 L195 238 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(380.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(1.28f, 1.28f)
                translate(-65f, -32f)
            }) {
                // Background Moon
                val moonOpacity = 0.8f + (0.2f * floatAnim)
                drawCircle(color = Color(0xFFFEF08A).copy(alpha = 0.18f * moonOpacity), radius = 40f, center = Offset(320f, 45f))
                drawCircle(color = Color(0xFFFEF08A).copy(alpha = 0.25f * moonOpacity), radius = 20f, center = Offset(320f, 45f))
                drawPath(moonPath, color = Color(0xFFFEF08A))
                drawPath(moonPath, color = Color(0xFFFEF9C3), style = Stroke(width = 1f))

                // Raindrops
                withTransform({
                    translate(-10f, -30f + (120f * orbitAnim))
                }) {
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(40f, 20f), Offset(35f, 45f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(120f, 10f), Offset(115f, 35f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(280f, 15f), Offset(275f, 40f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(330f, 30f), Offset(325f, 55f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.3f), Offset(80f, 80f), Offset(75f, 105f), strokeWidth = 1.0f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(160f, 70f), Offset(155f, 95f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(240f, 65f), Offset(235f, 90f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.3f), Offset(300f, 110f), Offset(295f, 135f), strokeWidth = 1.0f)
                }
                
                withTransform({
                    val offsetAnim = (orbitAnim + 0.5f) % 1f
                    translate(-10f, -30f + (120f * offsetAnim))
                }) {
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(50f, 170f), Offset(45f, 195f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(110f, 150f), Offset(105f, 175f), strokeWidth = 1.2f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.3f), Offset(270f, 160f), Offset(265f, 185f), strokeWidth = 1.0f)
                    drawLine(Color(0xFFA5F3FC).copy(alpha = 0.4f), Offset(340f, 180f), Offset(335f, 205f), strokeWidth = 1.2f)
                }

                // Platform
                drawOval(color = Color(0x8C000000), topLeft = Offset(195f - 153f, 305f - 60f), size = Size(306f, 120f))
                
                withTransform({ translate(0f, -8f * floatAnim) }) {
                    drawPath(baseTopPath, brush = baseTop)
                    drawPath(baseTopPath, color = Color(0xFFFFD700), style = Stroke(width = 4f))
                    drawPath(baseSideLeft, brush = baseSide)
                    drawPath(baseSideLeft, color = Color(0xFFD946EF), style = Stroke(width = 2f))
                    drawPath(baseSideRight, color = Color(0xFF090014))
                    drawPath(baseSideRight, color = Color(0xFFD946EF), style = Stroke(width = 2f))
                    drawPath(baseHighlight1, color = Color(0x14D946EF))
                    drawPath(baseHighlight1, color = Color(0xFFFBBF24), style = Stroke(width = 2f))
                    drawPath(baseHighlight2, color = Color(0x1438BDF8))
                    drawPath(baseHighlight2, color = Color(0xFF38BDF8), style = Stroke(width = 1.5f))

                    // Tier 1
                    drawPath(t1Front, brush = wallF)
                    drawPath(t1Front, color = Color(0xFFFF9B31), style = Stroke(width = 2.5f))
                    drawPath(t1Right, brush = wallR)
                    drawPath(t1Right, color = Color(0xFFFF9B31), style = Stroke(width = 2.5f))
                    drawPath(t1Roof, brush = roofGrad)
                    drawPath(t1Roof, color = Color(0xFFFFD36A), style = Stroke(width = 3f))

                    // Tier 2
                    drawPath(t2Front, brush = wallF)
                    drawPath(t2Front, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(t2Right, brush = wallR)
                    drawPath(t2Right, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(t2Roof, brush = roofGrad)
                    drawPath(t2Roof, color = Color(0xFFFFD36A), style = Stroke(width = 2.5f))

                    // Tier 3
                    drawPath(t3Front, brush = wallF)
                    drawPath(t3Front, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(t3Right, brush = wallR)
                    drawPath(t3Right, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(t3Roof, brush = roofGrad)
                    drawPath(t3Roof, color = Color(0xFFFFD36A), style = Stroke(width = 2.5f))

                    // Left Wing
                    drawPath(lwFront, brush = wallF)
                    drawPath(lwFront, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(lwRight, brush = wallR)
                    drawPath(lwRight, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(lwRoof, brush = roofGrad)
                    drawPath(lwRoof, color = Color(0xFFFFD36A), style = Stroke(width = 2f))

                    // Right Wing
                    drawPath(rwRoof, brush = roofGrad)
                    drawPath(rwRoof, color = Color(0xFFFFD36A), style = Stroke(width = 2f))
                    drawPath(rwFront, brush = wallF)
                    drawPath(rwFront, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(rwRight, brush = wallR)
                    drawPath(rwRight, color = Color(0xFFFF9B31), style = Stroke(width = 2f))

                    // Windows
                    val windowColor = Color(0xFFFFC66A).copy(alpha = 0.9f)
                    drawRoundRect(windowColor, topLeft = Offset(122f, 151f), size = Size(13f, 22f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(145f, 138f), size = Size(13f, 22f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(168f, 126f), size = Size(13f, 22f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(144f, 98f), size = Size(12f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(166f, 87f), size = Size(12f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(183f, 44f), size = Size(11f, 16f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(92f, 183f), size = Size(12f, 19f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(108f, 175f), size = Size(12f, 19f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(233f, 128f), size = Size(12f, 19f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(257f, 141f), size = Size(12f, 19f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(windowColor, topLeft = Offset(282f, 184f), size = Size(12f, 20f), cornerRadius = CornerRadius(2f, 2f))

                    // Balcony
                    drawPath(balcony, color = Color(0x8C50F3FF))
                    drawPath(balcony, color = Color(0xFFBAFFFF), style = Stroke(width = 1.5f))
                    
                    // Pillars
                    drawLine(Color(0xFFFFD700), Offset(163f, 194f), Offset(163f, 246f), strokeWidth = 1.5f)
                    drawCircle(Color(0xFFFFD700), radius = 3.5f, center = Offset(163f, 194f))
                    drawLine(Color(0xFFFFD700), Offset(227f, 194f), Offset(227f, 246f), strokeWidth = 1.5f)
                    drawCircle(Color(0xFFFFD700), radius = 3.5f, center = Offset(227f, 194f))

                    // Left Tower
                    drawPath(leftTowerFront, brush = wallF)
                    drawPath(leftTowerFront, color = Color(0xFFFFF0AA), style = Stroke(width = 2f))
                    drawPath(leftTowerRight, brush = wallR)
                    drawPath(leftTowerRight, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawPath(leftTowerRoof, brush = roofGrad)
                    drawPath(leftTowerRoof, color = Color(0xFFFFF0AA), style = Stroke(width = 2.3f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(96f, 134f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(113f, 125f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(130f, 135f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))

                    // Right Tower
                    drawPath(rightTowerRoof, brush = roofGrad)
                    drawPath(rightTowerRoof, color = Color(0xFFFFF0AA), style = Stroke(width = 2.3f))
                    drawPath(rightTowerFront, brush = wallF)
                    drawPath(rightTowerFront, color = Color(0xFFFFF0AA), style = Stroke(width = 2f))
                    drawPath(rightTowerRight, brush = wallR)
                    drawPath(rightTowerRight, color = Color(0xFFFF9B31), style = Stroke(width = 2f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(251f, 135f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(269f, 125f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))
                    drawRoundRect(Color(0xFFFFF0A0), topLeft = Offset(286f, 135f), size = Size(10f, 18f), cornerRadius = CornerRadius(2f, 2f))

                    // Gate
                    drawPath(gate1, color = Color(0xFF2C1A12))
                    drawPath(gate1, color = Color(0xFFFFD36A), style = Stroke(width = 2f))
                    drawPath(gate2, color = Color(0xFF7B4018))
                    drawPath(gate2, color = Color(0xFFFFD36A), style = Stroke(width = 2f))
                    drawPath(gate3, color = Color(0xFF5D2C13))
                    drawPath(gate3, color = Color(0xFFFFD36A), style = Stroke(width = 2f))

                    // Lightning - Opacity pulses
                    val l1Opacity = if (lightningAnim < 0.1f) 1f else if (lightningAnim in 0.2f..0.3f) 0.6f else 0f
                    if (l1Opacity > 0f) {
                        drawPath(lightning1, color = Color(0xFF38BDF8).copy(alpha = l1Opacity * 0.45f), style = Stroke(width = 5f))
                        drawPath(lightning1, color = Color.White.copy(alpha = l1Opacity), style = Stroke(width = 1.5f))
                    }
                    val l2Opacity = if (lightningAnim in 0.4f..0.5f) 1f else if (lightningAnim in 0.6f..0.7f) 0.6f else 0f
                    if (l2Opacity > 0f) {
                        drawPath(lightning2, color = Color(0xFFFBBF24).copy(alpha = l2Opacity * 0.45f), style = Stroke(width = 5f))
                        drawPath(lightning2, color = Color.White.copy(alpha = l2Opacity), style = Stroke(width = 1.5f))
                    }
                }
            }
        }
    }
}
