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
fun CarLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "car")
    
    val pulseAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -1.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val lightningAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "lightning"
    )

    // Gradients
    val bodyRed = Brush.linearGradient(
        colors = listOf(Color(0xFFFF0C3C), Color(0xFFDC002B), Color(0xFF91001A), Color(0xFF4A000B)),
        start = Offset(0f, 0f), end = Offset(600f, 250f)
    )
    val bodyCarbon = Brush.linearGradient(
        colors = listOf(Color(0xFF2A2D32), Color(0xFF181A1C), Color(0xFF0A0B0C)),
        start = Offset(0f, 0f), end = Offset(600f, 0f)
    )
    val wheelRimGrad = Brush.linearGradient(
        colors = listOf(Color(0xFF4B5563), Color(0xFF1F2937), Color(0xFF111827)),
        start = Offset(0f, 0f), end = Offset(100f, 100f)
    )
    val windshieldGrad = Brush.verticalGradient(
        colors = listOf(Color(0xFF0F172A), Color(0xFF020617), Color(0xFF1E1B4B)),
        startY = 0f, endY = 250f
    )

    // Paths
    val p1 = remember { PathParser().parsePathString("M50 160 Q80 105 180 95 Q300 80 430 95 Q520 105 560 160 Q565 170 540 180 Q430 195 300 195 Q170 195 60 180 Q35 170 50 160 Z").toPath() }
    val wheel1Cross1 = remember { PathParser().parsePathString("M150 137 L150 203 M117 170 L183 170 M127 147 L173 193 M127 193 L173 147").toPath() }
    val wheel2Cross1 = remember { PathParser().parsePathString("M470 137 L470 207 M435 172 L505 172 M445 147 L495 197 M445 197 L495 147").toPath() }
    
    val pCarbon1 = remember { PathParser().parsePathString("M45 185 L90 190 H520 L550 185 L565 192 L530 200 H80 L40 192 Z").toPath() }
    val pDark1 = remember { PathParser().parsePathString("M42 165 C40 160 55 155 75 155 C95 155 110 165 125 175 L80 185 Z").toPath() }
    val pRed1 = remember { PathParser().parsePathString("M40 170 C40 160 65 148 105 146 C125 145 150 152 170 165 L165 180 C130 182 80 182 40 170 Z").toPath() }
    val pRed2 = remember { PathParser().parsePathString("M45 170 C55 130 120 95 180 92 C230 90 280 88 320 94 C370 100 450 102 500 115 C540 125 560 145 565 165 C570 175 550 185 530 187 H75 L45 170 Z").toPath() }
    val pDark2 = remember { PathParser().parsePathString("M280 105 C330 105 380 110 405 120 C420 125 430 135 435 150 C410 155 350 160 280 150 Z").toPath() }
    val pRed3 = remember { PathParser().parsePathString("M290 100 C340 100 375 105 395 115 C410 122 418 130 422 142 C400 146 350 150 290 142 Z").toPath() }
    val pCarbon2 = remember { PathParser().parsePathString("M175 120 C180 105 210 95 260 92 C320 88 380 96 410 115 C420 122 422 135 410 140 C380 142 300 145 190 140 C175 135 170 128 175 120 Z").toPath() }
    val pWindshield = remember { PathParser().parsePathString("M190 118 C205 105 240 98 280 96 C330 94 370 100 395 112 L385 125 C350 122 280 120 205 125 Z").toPath() }
    val pReflect1 = remember { PathParser().parsePathString("M205 112 Q230 103 270 102").toPath() }
    
    val pLine1 = remember { PathParser().parsePathString("M95 170 C95 135 135 125 180 130 C195 132 205 142 200 155 C195 170 185 185 185 185").toPath() }
    val pLine2 = remember { PathParser().parsePathString("M100 170 C100 140 135 132 175 136").toPath() }
    val pLine3 = remember { PathParser().parsePathString("M415 172 C415 138 450 128 495 132 C515 134 525 145 520 162 L510 188").toPath() }

    val pCarbon3 = remember { PathParser().parsePathString("M500 115 L530 105 L555 105 L548 118 Z").toPath() }
    val pCarbon4 = remember { PathParser().parsePathString("M530 105 H565 V112 H548 Z").toPath() }
    
    val pDark3 = remember { PathParser().parsePathString("M72 152 Q82 145 110 148 L105 155 Q85 152 75 156 Z").toPath() }
    val pCyanLine = remember { PathParser().parsePathString("M75 151 Q85 146 108 149").toPath() }
    val pWhiteLine = remember { PathParser().parsePathString("M78 151 L95 150").toPath() }
    
    val pPoly = remember { PathParser().parsePathString("M56 170 L60 166 L64 170 L60 174 Z").toPath() }
    val pPinkLine = remember { PathParser().parsePathString("M562 138 C565 138 566 145 563 148").toPath() }

    val pCarbon5 = remember { PathParser().parsePathString("M210 116 Q200 112 188 115 Q185 118 198 120 L212 120 Z").toPath() }
    val pRed4 = remember { PathParser().parsePathString("M210 116 Q200 112 188 115 L190 117 Q198 115 208 118 Z").toPath() }

    val light1 = remember { PathParser().parsePathString("M 80 15 L 110 55 L 95 85 L 135 110 L 120 130 L 155 145").toPath() }
    val light2 = remember { PathParser().parsePathString("M 450 145 L 435 165 L 465 175 L 455 195").toPath() }
    val light3 = remember { PathParser().parsePathString("M 430 10 L 445 45 L 425 75 L 460 95 L 445 115 L 490 120").toPath() }

    Box(modifier = Modifier.width(300.dp).height(320.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.5f, 0.5f) // Adjust scale since viewbox is 600x250 but we fit in 300x320
                scale(1f, 1.6f)
                translate(10f, 160f)
            }) {
                drawOval(color = Color(0xD9000000), topLeft = Offset(300f - 270f, 205f - 18f), size = Size(540f, 36f))

                withTransform({ translate(0f, pulseAnim * 5f) }) { // Enhanced pulse jump for scaling fix
                    // Outline shadow
                    withTransform({
                        scale(1f, -0.6f)
                        translate(0f, -320f)
                    }) {
                        drawPath(p1, brush = bodyRed, alpha = 0.35f)
                    }

                    // Wheels
                    drawCircle(color = Color(0xFF0C0D0E), radius = 42f, center = Offset(150f, 170f))
                    drawCircle(color = Color(0xFF1C1E20), radius = 42f, center = Offset(150f, 170f), style = Stroke(width = 2f))
                    drawCircle(brush = wheelRimGrad, radius = 33f, center = Offset(150f, 170f))
                    drawPath(wheel1Cross1, color = Color(0xFF374151), style = Stroke(width = 2.5f))
                    drawCircle(color = Color(0xFF111827), radius = 14f, center = Offset(150f, 170f))
                    drawCircle(color = Color(0xFFFBBF24), radius = 14f, center = Offset(150f, 170f), style = Stroke(width = 1.5f))
                    drawCircle(color = Color(0xFFFBBF24), radius = 6f, center = Offset(150f, 170f))

                    drawCircle(color = Color(0xFF0C0D0E), radius = 44f, center = Offset(470f, 172f))
                    drawCircle(color = Color(0xFF1C1E20), radius = 44f, center = Offset(470f, 172f), style = Stroke(width = 2f))
                    drawCircle(brush = wheelRimGrad, radius = 35f, center = Offset(470f, 172f))
                    drawPath(wheel2Cross1, color = Color(0xFF374151), style = Stroke(width = 2.5f))
                    drawCircle(color = Color(0xFF111827), radius = 14f, center = Offset(470f, 172f))
                    drawCircle(color = Color(0xFFFBBF24), radius = 14f, center = Offset(470f, 172f), style = Stroke(width = 1.5f))
                    drawCircle(color = Color(0xFFFBBF24), radius = 6f, center = Offset(470f, 172f))

                    // Body Parts
                    drawPath(pCarbon1, brush = bodyCarbon)
                    drawPath(pDark1, color = Color(0xFF2D0006))
                    drawPath(pRed1, brush = bodyRed)
                    drawPath(pRed2, brush = bodyRed)
                    drawPath(pDark2, color = Color(0xFF3B000A))
                    drawPath(pRed3, brush = bodyRed)
                    drawPath(pRed3, color = Color(0xFFFF003C), style = Stroke(width = 0.8f))
                    drawPath(pCarbon2, brush = bodyCarbon)
                    
                    drawPath(pWindshield, brush = windshieldGrad)
                    drawPath(pWindshield, color = Color(0x26FFFFFF), style = Stroke(width = 1.5f))
                    drawPath(pReflect1, color = Color.White.copy(alpha = 0.5f), style = Stroke(width = 1.2f, cap = StrokeCap.Round))

                    drawPath(pLine1, brush = bodyRed, style = Stroke(width = 6f))
                    drawPath(pLine2, color = Color(0xFFFF003C).copy(alpha = 0.8f), style = Stroke(width = 1.5f))
                    drawPath(pLine3, brush = bodyRed, style = Stroke(width = 7f))

                    drawPath(pCarbon3, brush = bodyCarbon)
                    drawPath(pCarbon4, brush = bodyCarbon)

                    drawPath(pDark3, color = Color(0xFF111827))
                    drawPath(pCyanLine, color = Color(0xFF00F3FF), style = Stroke(width = 4f, cap = StrokeCap.Round))
                    drawPath(pWhiteLine, color = Color.White.copy(alpha = 0.9f), style = Stroke(width = 1.5f, cap = StrokeCap.Round))

                    drawPath(pPoly, color = Color(0xFFFBBF24))
                    drawPath(pPinkLine, color = Color(0xFFFF0055), style = Stroke(width = 5.5f, cap = StrokeCap.Round))

                    drawPath(pCarbon5, brush = bodyCarbon)
                    drawPath(pRed4, color = Color(0xFFFF003C))

                    // Lightning
                    val l1Opacity = if (lightningAnim < 0.2f) 1f else if (lightningAnim in 0.3f..0.4f) 0.8f else 0f
                    if (l1Opacity > 0f) {
                        drawPath(light1, color = Color(0xFF00F3FF).copy(alpha = l1Opacity), style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
                        drawPath(light2, color = Color(0xFF00F3FF).copy(alpha = l1Opacity), style = Stroke(width = 2.5f, cap = StrokeCap.Round))
                    }

                    val l2Opacity = if (lightningAnim in 0.5f..0.6f) 1f else if (lightningAnim in 0.7f..0.8f) 0.7f else 0f
                    if (l2Opacity > 0f) {
                        drawPath(light3, color = Color(0xFFFF007F).copy(alpha = l2Opacity), style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
                    }
                }
            }
        }
    }
}
