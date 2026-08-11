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
fun TrainLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "train")
    
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
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "beam"
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
    val real3DChrome = Brush.linearGradient(
        colors = listOf(
            Color(0xFFFFFFFF), Color(0xFFE2E8F0), Color(0xFF64748B), 
            Color(0xFF1E293B), Color(0xFFFFFFFF), Color(0xFF94A3B8), 
            Color(0xFF334155), Color(0xFFCBD5E1), Color(0xFF0F172A)
        ),
        start = Offset(0f, 0f), end = Offset(600f, 350f)
    )
    val real3DIron = Brush.verticalGradient(
        colors = listOf(Color(0xFF475569), Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617)),
        startY = 0f, endY = 350f
    )
    val real3DGlass = Brush.verticalGradient(
        colors = listOf(Color(0xFF020617), Color(0xFF0F172A), Color(0xFF1E3A8A), Color(0xFF1D4ED8)),
        startY = 0f, endY = 350f
    )

    // Paths
    val backBody = remember { PathParser().parsePathString("M260 150 C350 120 480 100 580 92 L580 195 C480 190 350 200 260 215 Z").toPath() }
    val backSpec1 = remember { PathParser().parsePathString("M260 162 C350 132 480 112 580 104").toPath() }
    val backSpec2 = remember { PathParser().parsePathString("M260 160 C350 130 480 110 580 102").toPath() }
    val backSpec3 = remember { PathParser().parsePathString("M260 185 C350 155 480 135 580 127").toPath() }
    val backSpec4 = remember { PathParser().parsePathString("M260 198 C350 168 480 148 580 140").toPath() }
    
    val win1 = remember { PathParser().parsePathString("M360 125 H400 L395 155 H355 Z").toPath() }
    val win2 = remember { PathParser().parsePathString("M430 120 H470 L465 150 H425 Z").toPath() }
    val win3 = remember { PathParser().parsePathString("M500 115 H540 L535 145 H495 Z").toPath() }
    val win1Spec = remember { PathParser().parsePathString("M362 127 L375 127 L368 153 Z").toPath() }
    val win2Spec = remember { PathParser().parsePathString("M432 122 L445 122 L438 148 Z").toPath() }

    val cabinFront1 = remember { PathParser().parsePathString("M120 220 C110 200 125 150 200 132 C260 118 280 148 260 215 C240 248 180 265 130 258 C115 254 122 232 120 220 Z").toPath() }
    val cabinFront2 = remember { PathParser().parsePathString("M125 210 C125 190 140 160 185 148 L220 180 L185 235 Z").toPath() }
    val cabinSpec1 = remember { PathParser().parsePathString("M130 188 C135 170 160 152 188 145").toPath() }
    val cabinSpec2 = remember { PathParser().parsePathString("M132 192 C137 175 162 158 190 150").toPath() }
    val cabinSpec3 = remember { PathParser().parsePathString("M140 240 C170 252 220 242 245 220").toPath() }
    
    val cabinSep1 = remember { PathParser().parsePathString("M175 138 C195 158 200 190 185 218").toPath() }
    val cabinSep2 = remember { PathParser().parsePathString("M210 242 C230 222 242 195 242 170").toPath() }

    val bumper = remember { PathParser().parsePathString("M125 252 L105 272 H135 L145 250 Z").toPath() }
    
    val canopy = remember { PathParser().parsePathString("M142 195 C146 168 178 145 220 140 C240 138 250 155 240 185 C225 210 188 222 158 218 C145 218 140 208 142 195 Z").toPath() }
    val canopySpec1 = remember { PathParser().parsePathString("M165 155 C185 148 215 148 225 158").toPath() }
    val hud = remember { PathParser().parsePathString("M182 165 C185 160 210 162 215 178").toPath() }

    val headlight = remember { PathParser().parsePathString("M152 222 L172 205 L180 215 L156 230 Z").toPath() }
    val headlightInner = remember { PathParser().parsePathString("M152 222 L172 205 L180 215 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(340.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(0.56f, 0.56f) // Fit 600x350 into 340x340
                translate(0f, 60f)
            }) {
                // Shadow
                drawOval(color = Color(0xCC000000), topLeft = Offset(300f - 190f, 285f - 14f), size = Size(380f, 28f))
                drawOval(color = Color(0xF2000000), topLeft = Offset(270f - 110f, 282f - 7f), size = Size(220f, 14f))

                // Tracks
                drawLine(Color(0xFF1E293B), start = Offset(40f, 330f), end = Offset(560f, 170f), strokeWidth = 18f)
                drawLine(Color(0xFFE2E8F0).copy(alpha = 0.9f), start = Offset(40f, 330f), end = Offset(560f, 170f), strokeWidth = 3f)
                drawLine(Color(0xFF38BDF8).copy(alpha = 0.6f), start = Offset(40f, 330f), end = Offset(560f, 170f), strokeWidth = 6f)

                drawLine(Color(0xFF0F172A), start = Offset(60f, 345f), end = Offset(580f, 185f), strokeWidth = 14f)
                drawLine(Color(0xFFF43F5E).copy(alpha = 0.5f), start = Offset(60f, 345f), end = Offset(580f, 185f), strokeWidth = 4f)

                withTransform({
                    scale(pulseAnim, pulseAnim, pivot = Offset(300f, 150f))
                    translate(0f, -12f * floatAnim)
                }) {
                    // Back Compartment
                    drawPath(backBody, brush = real3DChrome)
                    drawPath(backBody, color = Color(0xFF0F172A), style = Stroke(width = 1f))
                    
                    drawPath(backSpec1, color = Color.White.copy(alpha = 0.8f), style = Stroke(width = 2f))
                    drawPath(backSpec2, color = Color.Black.copy(alpha = 0.4f), style = Stroke(width = 1.5f))
                    drawPath(backSpec3, color = Color.White.copy(alpha = 0.7f), style = Stroke(width = 1.5f))
                    drawPath(backSpec4, color = Color.Black.copy(alpha = 0.5f), style = Stroke(width = 2.5f))

                    drawPath(win1, brush = real3DGlass)
                    drawPath(win1, color = Color(0xFF090D16), style = Stroke(width = 2f))
                    drawPath(win2, brush = real3DGlass)
                    drawPath(win2, color = Color(0xFF090D16), style = Stroke(width = 2f))
                    drawPath(win3, brush = real3DGlass)
                    drawPath(win3, color = Color(0xFF090D16), style = Stroke(width = 2f))

                    drawPath(win1Spec, color = Color.White.copy(alpha = 0.25f))
                    drawPath(win2Spec, color = Color.White.copy(alpha = 0.25f))

                    drawRoundRect(Color(0xFFFACC15).copy(alpha = 0.85f), topLeft = Offset(380f, 132f), size = Size(12f, 10f), cornerRadius = CornerRadius(1.5f, 1.5f))
                    drawRoundRect(Color(0xFFFACC15).copy(alpha = 0.85f), topLeft = Offset(450f, 127f), size = Size(12f, 10f), cornerRadius = CornerRadius(1.5f, 1.5f))

                    // Front Cabin
                    drawPath(cabinFront1, brush = real3DChrome)
                    drawPath(cabinFront1, color = Color(0xFF0F172A), style = Stroke(width = 1f))

                    drawPath(cabinFront2, brush = real3DChrome, alpha = 0.9f)
                    drawPath(cabinFront2, color = Color(0xFF0F172A), style = Stroke(width = 1.5f))

                    drawPath(cabinSpec1, color = Color.White.copy(alpha = 0.85f), style = Stroke(width = 4.5f, cap = StrokeCap.Round))
                    drawPath(cabinSpec2, color = Color(0xFF1E293B).copy(alpha = 0.5f), style = Stroke(width = 1.5f))
                    drawPath(cabinSpec3, color = Color.White.copy(alpha = 0.7f), style = Stroke(width = 3f, cap = StrokeCap.Round))

                    drawPath(cabinSep1, color = Color.Black.copy(alpha = 0.65f), style = Stroke(width = 2.5f))
                    drawPath(cabinSep1, color = Color.White.copy(alpha = 0.3f), style = Stroke(width = 1f))
                    drawPath(cabinSep2, color = Color.Black.copy(alpha = 0.6f), style = Stroke(width = 2.2f))

                    drawPath(bumper, brush = real3DIron)
                    drawPath(bumper, color = Color(0xFF475569), style = Stroke(width = 1.5f))

                    drawPath(canopy, brush = real3DGlass)
                    drawPath(canopy, color = Color(0xFF090D16), style = Stroke(width = 3f))

                    drawPath(canopySpec1, color = Color.White.copy(alpha = 0.75f), style = Stroke(width = 4f, cap = StrokeCap.Round))
                    drawLine(Color.White.copy(alpha = 0.35f), start = Offset(152f, 188f), end = Offset(188f, 170f), strokeWidth = 1.5f)

                    drawPath(hud, color = Color(0xFFF59E0B), style = Stroke(width = 2.5f))
                    // Text 57 rmP representation
                    drawLine(Color(0xFFFBBF24), start = Offset(185f, 168f), end = Offset(205f, 168f), strokeWidth = 2f)

                    // Bogies 1
                    withTransform({ translate(130f, 240f) }) {
                        drawRoundRect(brush = real3DIron, topLeft = Offset(-10f, 0f), size = Size(110f, 15f), cornerRadius = CornerRadius(7f, 7f))
                        drawRoundRect(color = Color(0xFF00F3FF), topLeft = Offset(-10f, 0f), size = Size(110f, 15f), cornerRadius = CornerRadius(7f, 7f), style = Stroke(width = 1.5f))

                        val rx = 18f + (12f * beamPulseAnim)
                        val ry = 4f + (4f * beamPulseAnim)
                        drawOval(color = Color(0xFF38BDF8).copy(alpha = 0.8f), topLeft = Offset(20f - rx, 22f - ry), size = Size(rx * 2, ry * 2), style = Stroke(width = 2f))
                        drawOval(color = Color(0xFF38BDF8).copy(alpha = 0.8f), topLeft = Offset(70f - rx, 22f - ry), size = Size(rx * 2, ry * 2), style = Stroke(width = 2f))

                        drawCircle(color = Color(0xFF0F172A), radius = 10f, center = Offset(20f, 10f))
                        drawCircle(color = Color(0xFF00F3FF), radius = 10f, center = Offset(20f, 10f), style = Stroke(width = 2f))
                        drawCircle(color = Color(0xFF00F3FF), radius = 5f, center = Offset(20f, 10f))
                        
                        drawCircle(color = Color(0xFF0F172A), radius = 10f, center = Offset(70f, 10f))
                        drawCircle(color = Color(0xFF00F3FF), radius = 10f, center = Offset(70f, 10f), style = Stroke(width = 2f))
                        drawCircle(color = Color(0xFF00F3FF), radius = 5f, center = Offset(70f, 10f))
                    }

                    // Bogies 2
                    withTransform({ translate(320f, 195f) }) {
                        drawRoundRect(brush = real3DIron, topLeft = Offset(0f, 0f), size = Size(100f, 14f), cornerRadius = CornerRadius(5f, 5f))
                        drawRoundRect(color = Color(0xFFF43F5E), topLeft = Offset(0f, 0f), size = Size(100f, 14f), cornerRadius = CornerRadius(5f, 5f), style = Stroke(width = 1.2f))

                        val rx = 16f + (10f * beamPulseAnim)
                        val ry = 3f + (4f * beamPulseAnim)
                        drawOval(color = Color(0xFFF43F5E).copy(alpha = 0.7f), topLeft = Offset(25f - rx, 20f - ry), size = Size(rx * 2, ry * 2), style = Stroke(width = 1.5f))
                        drawOval(color = Color(0xFFF43F5E).copy(alpha = 0.7f), topLeft = Offset(75f - rx, 20f - ry), size = Size(rx * 2, ry * 2), style = Stroke(width = 1.5f))

                        drawCircle(color = Color(0xFF0F172A), radius = 8f, center = Offset(25f, 10f))
                        drawCircle(color = Color(0xFFF43F5E), radius = 8f, center = Offset(25f, 10f), style = Stroke(width = 1.5f))
                        
                        drawCircle(color = Color(0xFF0F172A), radius = 8f, center = Offset(75f, 10f))
                        drawCircle(color = Color(0xFFF43F5E), radius = 8f, center = Offset(75f, 10f), style = Stroke(width = 1.5f))
                    }

                    // Headlights
                    drawPath(headlight, color = Color.White)
                    drawPath(headlightInner, color = Color(0xFF38BDF8))

                    drawCircle(color = Color(0xFFF97316), radius = 4.5f, center = Offset(198f, 226f))
                    drawCircle(color = Color(0xFFF97316), radius = 3.5f, center = Offset(208f, 232f))

                    // Sparks
                    val x1 = 220f - (190f * auraRotateAnim)
                    val x2 = 190f - (180f * auraRotateAnim)
                    drawLine(Color(0xFFF43F5E).copy(alpha = 0.8f), start = Offset(x1, 280f), end = Offset(x2, 280f), strokeWidth = 2f)

                    val x3 = 420f - (160f * auraRotateAnim)
                    val x4 = 380f - (160f * auraRotateAnim)
                    drawLine(Color(0xFF38BDF8).copy(alpha = 0.7f), start = Offset(x3, 250f), end = Offset(x4, 250f), strokeWidth = 2.5f)
                }
            }
        }
    }
}
