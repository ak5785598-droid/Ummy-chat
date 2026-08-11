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
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

@Composable
fun RocketLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "rocket")
    
    // 0 to 1 for continuous animations
    val animPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "flame"
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

    // Gradients
    val dangerousCarbon = Brush.linearGradient(
        colors = listOf(Color(0xFF2D3748), Color(0xFF1A202C), Color(0xFF0A0F1D)),
        start = Offset(0f, 0f), end = Offset(100f, 100f)
    )
    
    val dangerousCrimson = Brush.linearGradient(
        colors = listOf(Color(0xFFEF4444), Color(0xFFDC2626), Color(0xFF7F1D1D)),
        start = Offset(0f, 0f), end = Offset(0f, 300f)
    )
    
    val dangerousAmberGlass = Brush.linearGradient(
        colors = listOf(Color(0xFFFEF08A), Color(0xFFF97316), Color(0xFF9A3412)),
        start = Offset(0f, 0f), end = Offset(0f, 200f)
    )
    
    val dangerousFlameGrad = Brush.linearGradient(
        colors = listOf(Color(0xFFEF4444).copy(alpha = 0.95f), Color(0xFFF97316).copy(alpha = 0.75f), Color.Transparent),
        start = Offset(0f, 245f), end = Offset(0f, 360f)
    )

    // Parse static paths once
    val leftWing = remember { PathParser().parsePathString("M245 130 C200 170 160 190 160 245 L240 225 Z").toPath() }
    val rightWing = remember { PathParser().parsePathString("M355 130 C400 170 440 190 440 245 L360 225 Z").toPath() }
    val mainBody = remember { PathParser().parsePathString("M300 -50 C215 95 230 215 245 255 L300 275 L355 255 C370 215 385 95 300 -50 Z").toPath() }
    val specularLeft = remember { PathParser().parsePathString("M300 -48 C225 95 238 205 252 245").toPath() }
    val specularRight = remember { PathParser().parsePathString("M300 -50 C245 95 258 205 272 245").toPath() }
    val amberGlass = remember { PathParser().parsePathString("M300 5 C265 95 265 175 265 195 H335 C335 175 335 95 300 5 Z").toPath() }
    val glassSpec = remember { PathParser().parsePathString("M295 28 A 22 22 0 0 1 318 70").toPath() }
    val nozzleConn = remember { PathParser().parsePathString("M260 255 H340 L330 267 H270 Z").toPath() }

    // Dynamic paths for flames
    val leftFlameOuter = remember(animPhase) {
        val qy = 285f + (10f * animPhase)
        val endY = 330f + (20f * animPhase)
        PathParser().parsePathString("M267 245 Q245 $qy 260 $endY Q285 $qy 267 245 Z").toPath()
    }
    val leftFlameMid = remember(animPhase) {
        val qy = 280f + (5f * animPhase)
        val endY = 305f + (15f * animPhase)
        PathParser().parsePathString("M267 245 Q255 $qy 267 $endY Q275 $qy 267 245 Z").toPath()
    }
    val leftFlameInner = remember(animPhase) {
        val endY = 280f + (15f * animPhase)
        PathParser().parsePathString("M265 245 L268 $endY L267 245 Z").toPath()
    }
    
    val rightFlameOuter = remember(animPhase) {
        val qy = 285f + (10f * animPhase)
        val endY = 330f + (20f * animPhase)
        PathParser().parsePathString("M333 245 Q315 $qy 330 $endY Q355 $qy 333 245 Z").toPath()
    }
    val rightFlameMid = remember(animPhase) {
        val qy = 280f + (5f * animPhase)
        val endY = 305f + (15f * animPhase)
        PathParser().parsePathString("M333 245 Q325 $qy 333 $endY Q345 $qy 333 245 Z").toPath()
    }
    val rightFlameInner = remember(animPhase) {
        val endY = 280f + (15f * animPhase)
        PathParser().parsePathString("M331 245 L332 $endY L333 245 Z").toPath()
    }

    Box(
        modifier = Modifier
            .width(340.dp)
            .height(380.dp)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(1.28f, 1.28f)
                translate(-65f, -32f)
            }) {
                // 1. Pedestal (Glow simulated by drawing twice with alpha/stroke)
                drawOval(
                    color = Color(0xFFF97316).copy(alpha = 0.4f),
                    topLeft = Offset(300f - 145f, 285f - 30f),
                    size = Size(290f, 60f),
                    style = Stroke(width = 8f)
                )
                drawOval(
                    color = Color(0xFFF97316),
                    topLeft = Offset(300f - 140f, 285f - 25f),
                    size = Size(280f, 50f),
                    style = Stroke(width = 3f)
                )
                drawOval(
                    color = Color(0xFFEF4444),
                    topLeft = Offset(300f - 90f, 285f - 16f),
                    size = Size(180f, 32f),
                    style = Stroke(width = 1.5f)
                )

                // Apply floating to the rocket
                withTransform({
                    translate(0f, -16f * floatAnim)
                }) {
                    // Left Wing
                    drawPath(leftWing, brush = dangerousCrimson)
                    drawPath(leftWing, color = Color(0xFFEF4444), style = Stroke(width = 1.5f))
                    val leftPoly = Path().apply {
                        moveTo(175f, 205f); lineTo(230f, 195f); lineTo(228f, 218f); lineTo(170f, 225f); close()
                    }
                    drawPath(leftPoly, color = Color(0xFFF97316).copy(alpha = 0.7f))
                    drawLine(Color.White.copy(alpha = 0.4f), Offset(170f, 230f), Offset(230f, 220f), strokeWidth = 1f)

                    // Right Wing
                    drawPath(rightWing, brush = dangerousCrimson)
                    drawPath(rightWing, color = Color(0xFFEF4444), style = Stroke(width = 1.5f))
                    val rightPoly = Path().apply {
                        moveTo(425f, 205f); lineTo(370f, 195f); lineTo(372f, 218f); lineTo(430f, 225f); close()
                    }
                    drawPath(rightPoly, color = Color(0xFFF97316).copy(alpha = 0.7f))
                    drawLine(Color.White.copy(alpha = 0.4f), Offset(430f, 230f), Offset(370f, 220f), strokeWidth = 1f)

                    // Main Body
                    drawPath(mainBody, brush = dangerousCarbon)
                    drawPath(mainBody, color = Color(0xFFEF4444), style = Stroke(width = 1f))
                    
                    // Speculars
                    drawPath(specularLeft, color = Color.White.copy(alpha = 0.5f), style = Stroke(width = 3.5f, cap = StrokeCap.Round))
                    drawPath(specularRight, color = Color(0xFFF97316).copy(alpha = 0.6f), style = Stroke(width = 1.5f))

                    // Glass
                    drawPath(amberGlass, brush = dangerousAmberGlass)
                    drawPath(amberGlass, color = Color(0xFFF97316), style = Stroke(width = 1.5f))
                    drawPath(glassSpec, color = Color.White.copy(alpha = 0.6f), style = Stroke(width = 3.5f))

                    // Core Node
                    drawRoundRect(
                        color = Color(0xFF0F172A),
                        topLeft = Offset(282f, 155f),
                        size = Size(36f, 30f),
                        cornerRadius = CornerRadius(3f, 3f)
                    )
                    drawRoundRect(
                        color = Color(0xFFEF4444),
                        topLeft = Offset(282f, 155f),
                        size = Size(36f, 30f),
                        cornerRadius = CornerRadius(3f, 3f),
                        style = Stroke(width = 2f)
                    )
                    drawCircle(color = Color(0xFFF97316).copy(alpha = 0.4f), radius = 10f, center = Offset(300f, 170f))
                    drawCircle(color = Color(0xFFF97316), radius = 5f, center = Offset(300f, 170f))

                    // Nozzle Connectors
                    drawPath(nozzleConn, color = Color(0xFF1A202C))
                    drawPath(nozzleConn, color = Color(0xFF475569), style = Stroke(width = 1f))

                    // Left Nozzle Box
                    drawRoundRect(color = Color(0xFF2D3748), topLeft = Offset(245f, 218f), size = Size(45f, 32f), cornerRadius = CornerRadius(10f, 10f))
                    drawRoundRect(color = Color(0xFFEF4444), topLeft = Offset(245f, 218f), size = Size(45f, 32f), cornerRadius = CornerRadius(10f, 10f), style = Stroke(width = 2.5f))
                    drawCircle(color = Color(0xFF0F172A), radius = 11f, center = Offset(267f, 234f))

                    // Right Nozzle Box
                    drawRoundRect(color = Color(0xFF2D3748), topLeft = Offset(310f, 218f), size = Size(45f, 32f), cornerRadius = CornerRadius(10f, 10f))
                    drawRoundRect(color = Color(0xFFEF4444), topLeft = Offset(310f, 218f), size = Size(45f, 32f), cornerRadius = CornerRadius(10f, 10f), style = Stroke(width = 2.5f))
                    drawCircle(color = Color(0xFF0F172A), radius = 11f, center = Offset(333f, 234f))

                    // Bottom Stabilizer Fin
                    val finPath = Path().apply { moveTo(293f, 238f); lineTo(307f, 238f); lineTo(300f, 280f); close() }
                    drawPath(finPath, brush = dangerousCrimson)
                    drawPath(finPath, color = Color(0xFFEF4444), style = Stroke(width = 1f))

                    // Heavy Smoke Effect (Below the fire)
                    val smokeY1 = 300f + (70f * animPhase)
                    val smokeY2 = 320f + (70f * ((animPhase + 0.5f) % 1f))
                    val smokeRadius1 = 15f + (40f * animPhase)
                    val smokeRadius2 = 15f + (40f * ((animPhase + 0.5f) % 1f))
                    val smokeAlpha1 = (1f - animPhase) * 0.4f
                    val smokeAlpha2 = (1f - ((animPhase + 0.5f) % 1f)) * 0.4f

                    drawCircle(color = Color(0xFF64748B).copy(alpha = smokeAlpha1), radius = smokeRadius1, center = Offset(267f - 10f * animPhase, smokeY1))
                    drawCircle(color = Color(0xFF64748B).copy(alpha = smokeAlpha1), radius = smokeRadius1, center = Offset(333f + 10f * animPhase, smokeY1))
                    drawCircle(color = Color(0xFF475569).copy(alpha = smokeAlpha2), radius = smokeRadius2, center = Offset(267f + 5f * animPhase, smokeY2))
                    drawCircle(color = Color(0xFF475569).copy(alpha = smokeAlpha2), radius = smokeRadius2, center = Offset(333f - 5f * animPhase, smokeY2))

                    // Flames
                    drawPath(leftFlameOuter, brush = dangerousFlameGrad)
                    drawPath(leftFlameMid, color = Color(0xFFFFF5E6).copy(alpha = 0.9f))
                    drawPath(leftFlameInner, color = Color(0xFFFACC15))
                    
                    drawPath(rightFlameOuter, brush = dangerousFlameGrad)
                    drawPath(rightFlameMid, color = Color(0xFFFFF5E6).copy(alpha = 0.9f))
                    drawPath(rightFlameInner, color = Color(0xFFFACC15))
                    
                    // Particles (Sparks)
                    val particleY1 = 255f + (100f * animPhase)
                    val particleY2 = 255f + (100f * ((animPhase + 0.5f) % 1f))
                    val particleRadius = 5f - (4f * animPhase)
                    val particleAlpha = if (animPhase < 0.8f) (1f - (animPhase / 0.8f)) else 0f
                    val particleAlpha2 = if (((animPhase + 0.5f) % 1f) < 0.8f) (1f - (((animPhase + 0.5f) % 1f) / 0.8f)) else 0f
                    
                    drawCircle(color = Color(0xFFF97316).copy(alpha = particleAlpha), radius = particleRadius, center = Offset(255f, particleY1))
                    drawCircle(color = Color(0xFFF97316).copy(alpha = particleAlpha), radius = particleRadius, center = Offset(345f, particleY1))
                    
                    drawCircle(color = Color(0xFFFACC15).copy(alpha = particleAlpha2), radius = particleRadius * 0.8f, center = Offset(275f, particleY2))
                    drawCircle(color = Color(0xFFFACC15).copy(alpha = particleAlpha2), radius = particleRadius * 0.8f, center = Offset(325f, particleY2))
                }
            }
        }
    }
}
