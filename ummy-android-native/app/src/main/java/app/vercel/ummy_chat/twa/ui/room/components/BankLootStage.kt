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
fun BankLootStage() {
    val infiniteTransition = rememberInfiniteTransition(label = "bank")
    
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
            animation = tween(2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbit"
    )

    // Gradients
    val marbleWallF = Brush.verticalGradient(
        colors = listOf(Color(0xFFFFFFFF), Color(0xFFF1F5F9), Color(0xFFCBD5E1)),
        startY = 0f, endY = 400f
    )
    val marbleWallR = Brush.verticalGradient(
        colors = listOf(Color(0xFFE2E8F0), Color(0xFF94A3B8)),
        startY = 0f, endY = 400f
    )
    val goldClassic = Brush.linearGradient(
        colors = listOf(Color(0xFFFFE082), Color(0xFFFFD54F), Color(0xFFFFB300)),
        start = Offset(0f, 0f), end = Offset(400f, 400f)
    )
    val roofShadow = Brush.verticalGradient(
        colors = listOf(Color(0xFF475569), Color(0xFF1E293B)),
        startY = 0f, endY = 200f
    )

    // Paths
    val baseBottom1 = remember { PathParser().parsePathString("M60 290 L200 220 L340 290 L200 360 Z").toPath() }
    val baseBottom2 = remember { PathParser().parsePathString("M60 290 L200 360 L200 372 L60 302 Z").toPath() }
    val baseBottom3 = remember { PathParser().parsePathString("M340 290 L200 360 L200 372 L340 302 Z").toPath() }

    val baseMid1 = remember { PathParser().parsePathString("M75 282 L200 220 L325 282 L200 344 Z").toPath() }
    val baseMid2 = remember { PathParser().parsePathString("M75 282 L200 344 L200 353 L75 291 Z").toPath() }
    val baseMid3 = remember { PathParser().parsePathString("M325 282 L200 344 L200 353 L325 291 Z").toPath() }

    val baseTop1 = remember { PathParser().parsePathString("M90 274 L200 220 L310 274 L200 328 Z").toPath() }
    val baseTop2 = remember { PathParser().parsePathString("M90 274 L200 328 L200 335 L90 281 Z").toPath() }
    val baseTop3 = remember { PathParser().parsePathString("M310 274 L200 328 L200 335 L310 281 Z").toPath() }

    val col1f = remember { PathParser().parsePathString("M102 260 L102 165 L116 158 L116 253 Z").toPath() }
    val col1r = remember { PathParser().parsePathString("M116 253 L116 158 L126 163 L126 258 Z").toPath() }

    val col2f = remember { PathParser().parsePathString("M142 240 L142 157 L153 151 L153 234 Z").toPath() }
    val col2r = remember { PathParser().parsePathString("M153 234 L153 151 L162 156 L162 239 Z").toPath() }

    val col3f = remember { PathParser().parsePathString("M238 239 L238 156 L247 151 L247 234 Z").toPath() }
    val col3r = remember { PathParser().parsePathString("M247 234 L247 151 L258 157 L258 240 Z").toPath() }

    val col4f = remember { PathParser().parsePathString("M274 258 L274 163 L284 158 L284 253 Z").toPath() }
    val col4r = remember { PathParser().parsePathString("M284 253 L284 158 L298 265 L298 260 Z").toPath() }

    val vaultDoor = remember { PathParser().parsePathString("M172 230 L172 152 L228 152 L228 230 Z").toPath() }
    
    val pediment1 = remember { PathParser().parsePathString("M 80 165 L 200 95 L 320 165 Z").toPath() }
    val pediment2 = remember { PathParser().parsePathString("M 95 160 L 200 108 L 305 160 Z").toPath() }

    Box(modifier = Modifier.width(340.dp).height(380.dp)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            withTransform({
                scale(1.15f, 1.15f)
                translate(-50f, -40f)
            }) {
                // Base Shadow
                drawOval(color = Color(0x8C000000), topLeft = Offset(200f - 150f, 315f - 50f), size = Size(300f, 100f))

                withTransform({ translate(0f, -12f * floatAnim) }) {
                    // Step 1
                    drawPath(baseBottom1, brush = marbleWallR)
                    drawPath(baseBottom1, color = Color(0xFF94A3B8), style = Stroke(width = 1.5f))
                    drawPath(baseBottom2, color = Color(0xFF64748B))
                    drawPath(baseBottom3, color = Color(0xFF475569))

                    // Step 2
                    drawPath(baseMid1, brush = marbleWallF)
                    drawPath(baseMid1, color = Color(0xFFCBD5E1), style = Stroke(width = 1f))
                    drawPath(baseMid2, color = Color(0xFF94A3B8))
                    drawPath(baseMid3, color = Color(0xFF64748B))

                    // Step 3
                    drawPath(baseTop1, brush = marbleWallR)
                    drawPath(baseTop1, color = Color(0xFF94A3B8), style = Stroke(width = 1f))
                    drawPath(baseTop2, color = Color(0xFF64748B))
                    drawPath(baseTop3, color = Color(0xFF475569))

                    // Columns
                    drawPath(col1f, brush = marbleWallF)
                    drawPath(col1r, brush = marbleWallR)
                    drawRoundRect(brush = goldClassic, topLeft = Offset(100f, 156f), size = Size(28f, 6f), cornerRadius = CornerRadius(1.5f, 1.5f))
                    drawRoundRect(brush = goldClassic, topLeft = Offset(100f, 255f), size = Size(28f, 6f), cornerRadius = CornerRadius(1.5f, 1.5f))

                    drawPath(col2f, brush = marbleWallF)
                    drawPath(col2r, brush = marbleWallR)
                    drawRoundRect(brush = goldClassic, topLeft = Offset(140f, 149f), size = Size(24f, 5f), cornerRadius = CornerRadius(1.5f, 1.5f))
                    drawRoundRect(brush = goldClassic, topLeft = Offset(140f, 236f), size = Size(24f, 5f), cornerRadius = CornerRadius(1.5f, 1.5f))

                    drawPath(col3f, brush = marbleWallF)
                    drawPath(col3r, brush = marbleWallR)
                    drawRoundRect(brush = goldClassic, topLeft = Offset(236f, 149f), size = Size(24f, 5f), cornerRadius = CornerRadius(1.5f, 1.5f))
                    drawRoundRect(brush = goldClassic, topLeft = Offset(236f, 236f), size = Size(24f, 5f), cornerRadius = CornerRadius(1.5f, 1.5f))

                    drawPath(col4f, brush = marbleWallF)
                    drawPath(col4r, brush = marbleWallR)
                    drawRoundRect(brush = goldClassic, topLeft = Offset(272f, 156f), size = Size(28f, 6f), cornerRadius = CornerRadius(1.5f, 1.5f))
                    drawRoundRect(brush = goldClassic, topLeft = Offset(272f, 255f), size = Size(28f, 6f), cornerRadius = CornerRadius(1.5f, 1.5f))

                    // Vault Door
                    drawPath(vaultDoor, color = Color(0xFF1E293B))
                    drawPath(vaultDoor, brush = goldClassic, style = Stroke(width = 2.2f))
                    
                    drawCircle(color = Color(0xFF0F172A), radius = 24f, center = Offset(200f, 191f))
                    drawCircle(brush = goldClassic, radius = 24f, center = Offset(200f, 191f), style = Stroke(width = 3f))
                    drawCircle(brush = goldClassic, radius = 14f, center = Offset(200f, 191f))
                    drawLine(brush = goldClassic, start = Offset(200f, 167f), end = Offset(200f, 215f), strokeWidth = 2.5f)
                    drawLine(brush = goldClassic, start = Offset(176f, 191f), end = Offset(224f, 191f), strokeWidth = 2.5f)
                    drawCircle(color = Color.White, radius = 5f, center = Offset(200f, 191f))

                    // Pediment
                    drawPath(pediment1, brush = marbleWallR)
                    drawPath(pediment1, brush = goldClassic, style = Stroke(width = 4f))
                    drawPath(pediment2, brush = roofShadow)

                    drawCircle(brush = goldClassic, radius = 13f, center = Offset(200f, 138f))
                    // Dollar Sign text (approx)
                    drawLine(color = Color.White, start = Offset(200f, 130f), end = Offset(200f, 146f), strokeWidth = 2f)
                    drawPath(PathParser().parsePathString("M203 133 C195 133, 195 138, 200 138 C205 138, 205 143, 197 143").toPath(), color = Color.White, style = Stroke(width = 1.5f))

                    drawLine(brush = goldClassic, start = Offset(200f, 95f), end = Offset(200f, 80f), strokeWidth = 3f)
                    drawCircle(color = Color.White, radius = 4.5f, center = Offset(200f, 80f))

                    // Stacked Coins
                    val drawCoinStack = { cx: Float, cy: Float ->
                        drawOval(brush = goldClassic, topLeft = Offset(cx - 14f, cy - 5f), size = Size(28f, 10f))
                        drawOval(color = Color(0xFFD97706), topLeft = Offset(cx - 14f, cy - 5f), size = Size(28f, 10f), style = Stroke(width = 1f))
                    }
                    drawCoinStack(125f, 280f)
                    drawCoinStack(125f, 276f)
                    drawCoinStack(125f, 272f)

                    drawCoinStack(275f, 280f)
                    drawCoinStack(275f, 276f)
                    drawCoinStack(275f, 272f)

                    // Animated Rolling Coins
                    val cOpacity = if (orbitAnim in 0.1f..0.9f) 1f else 0f
                    if (cOpacity > 0f) {
                        val c1y = orbitAnim * 60f
                        val c1x = orbitAnim * -35f
                        withTransform({ translate(c1x, c1y) }) {
                            drawCircle(brush = goldClassic, radius = 5.5f, center = Offset(190f, 210f))
                            drawCircle(color = Color(0xFFD97706), radius = 5.5f, center = Offset(190f, 210f), style = Stroke(width = 0.8f))
                        }
                        
                        val c2y = orbitAnim * 55f
                        val c2x = orbitAnim * 30f
                        withTransform({ translate(c2x, c2y) }) {
                            drawCircle(brush = goldClassic, radius = 5.5f, center = Offset(210f, 210f))
                            drawCircle(color = Color(0xFFD97706), radius = 5.5f, center = Offset(210f, 210f), style = Stroke(width = 0.8f))
                        }

                        val c3y = orbitAnim * 75f
                        val c3x = orbitAnim * -8f
                        withTransform({ translate(c3x, c3y) }) {
                            drawCircle(brush = goldClassic, radius = 5.5f, center = Offset(200f, 215f))
                            drawCircle(color = Color(0xFFD97706), radius = 5.5f, center = Offset(200f, 215f), style = Stroke(width = 0.8f))
                        }
                    }

                    // Flying Cash
                    val wx1 = -80f + (160f * orbitAnim)
                    val wy1 = 20f + (-70f * orbitAnim)
                    withTransform({ translate(wx1, wy1) }) {
                        withTransform({ rotate(15f, Offset(158f, 244f)) }) {
                            drawRoundRect(color = Color(0xFF86EFAC), topLeft = Offset(150f, 240f), size = Size(16f, 8f), cornerRadius = CornerRadius(1.5f, 1.5f))
                        }
                        withTransform({ rotate(-25f, Offset(237f, 253.5f)) }) {
                            drawRoundRect(color = Color(0xFFFEF08A), topLeft = Offset(230f, 250f), size = Size(14f, 7f), cornerRadius = CornerRadius(1f, 1f))
                        }
                    }

                    val wx2 = 60f + (-150f * orbitAnim)
                    val wy2 = 10f + (-70f * orbitAnim)
                    withTransform({ translate(wx2, wy2) }) {
                        withTransform({ rotate(-10f, Offset(137.5f, 214f)) }) {
                            drawRoundRect(color = Color(0xFF86EFAC), topLeft = Offset(130f, 210f), size = Size(15f, 8f), cornerRadius = CornerRadius(1f, 1f))
                        }
                        withTransform({ rotate(35f, Offset(268.5f, 204.5f)) }) {
                            drawRoundRect(color = Color(0xFFA7F3D0), topLeft = Offset(260f, 200f), size = Size(17f, 9f), cornerRadius = CornerRadius(1.5f, 1.5f))
                        }
                    }
                }
            }
        }
    }
}
