package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// React Native native-svgs.tsx GlossyCalendarIcon — ported with viewBox 0 0 1024 1024
@Composable
fun GlossyCalendarIcon(
    size: Dp = 58.dp,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.size(size)) {
        val s = size.toPx() / 1024f

        // Background: radial gradient #C084F5 -> #9D4EDD -> #6B21A8, rx 228
        drawRoundRect(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFC084F5), Color(0xFF9D4EDD), Color(0xFF6B21A8)),
                center = Offset(512f * s, 500f * s),
                radius = 640f * s
            ),
            topLeft = Offset.Zero,
            size = Size(1024f * s, 1024f * s),
            cornerRadius = CornerRadius(228f * s)
        )

        // Sparkles (opacity 0.55)
        translate(left = 260f * s, top = 350f * s) {
            drawSparkle(s, color = Color.White, alpha = 0.55f)
        }
        // Sparkle small (scale 0.56, opacity 0.4)
        translate(left = 188f * s, top = 232f * s) {
            drawSparkle(s * 0.56f, color = Color.White, alpha = 0.4f)
        }

        // Calendar group: translate(588,552) rotate(-9)
        translate(left = 588f * s, top = 552f * s) {
            rotate(-9f) {
                // Shadow
                drawRoundRect(
                    color = Color(0xFFC5A9F0).copy(alpha = 0.45f),
                    topLeft = Offset(10f * s, 16f * s),
                    size = Size(460f * s, 540f * s),
                    cornerRadius = CornerRadius(34f * s)
                )
                // White card
                drawRoundRect(
                    color = Color.White,
                    topLeft = Offset(-230f * s, -272f * s),
                    size = Size(460f * s, 540f * s),
                    cornerRadius = CornerRadius(34f * s)
                )
                // Header #4FC3F7
                drawRoundRect(
                    color = Color(0xFF4FC3F7),
                    topLeft = Offset(-230f * s, -272f * s),
                    size = Size(460f * s, 122f * s),
                    cornerRadius = CornerRadius(34f * s)
                )
                // Gloss overlay on header
                drawRoundRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.White.copy(alpha = 0.35f), Color.White.copy(alpha = 0f)),
                        startY = -272f * s,
                        endY = -150f * s
                    ),
                    topLeft = Offset(-230f * s, -272f * s),
                    size = Size(460f * s, 122f * s),
                    cornerRadius = CornerRadius(34f * s)
                )
                // Binding
                drawRoundRect(
                    color = Color.Black.copy(alpha = 0.04f),
                    topLeft = Offset(206f * s, -248f * s),
                    size = Size(18f * s, 496f * s),
                    cornerRadius = CornerRadius(9f * s)
                )
                // Bottom line #E9EBEF
                drawRoundRect(
                    color = Color(0xFFE9EBEF),
                    topLeft = Offset(-228f * s, 250f * s),
                    size = Size(456f * s, 18f * s),
                    cornerRadius = CornerRadius(9f * s)
                )
                // White glow behind checkmark (y -4, opacity 0.07)
                drawCheckmark(s, yOffset = -4f * s, color = Color.White.copy(alpha = 0.07f))
                // Checkmark #00A6ED
                drawCheckmark(s, color = Color(0xFF00A6ED))
                // Ring bindings
                drawRing(s, centerX = -98f)
                drawRing(s, centerX = 98f)
            }
        }
    }
}

private fun DrawScope.drawSparkle(s: Float, color: Color, alpha: Float) {
    val path = Path().apply {
        moveTo(0f, -72f * s)
        lineTo(72f * s, 0f)
        lineTo(0f, 72f * s)
        lineTo(-72f * s, 0f)
        close()
    }
    drawPath(path, color = color.copy(alpha = alpha))
}

private fun DrawScope.drawCheckmark(s: Float, yOffset: Float = 0f, color: Color) {
    val path = Path().apply {
        moveTo(-88f * s, 18f * s + yOffset)
        lineTo(-16f * s, 90f * s + yOffset)
        lineTo(108f * s, -56f * s + yOffset)
    }
    drawPath(
        path = path,
        color = color,
        style = androidx.compose.ui.graphics.drawscope.Stroke(
            width = 56f * s,
            cap = androidx.compose.ui.graphics.StrokeCap.Round,
            join = androidx.compose.ui.graphics.StrokeJoin.Round
        )
    )
}

private fun DrawScope.drawRing(s: Float, centerX: Float) {
    // Shadow
    drawRoundRect(
        color = Color(0xFFE2E4E8).copy(alpha = 0.45f),
        topLeft = Offset(centerX * s - 30f * s, -286f * s),
        size = Size(60f * s, 84f * s),
        cornerRadius = CornerRadius(26f * s)
    )
    // Bottom ellipse (back layer)
    drawOval(
        color = Color.White.copy(alpha = 0.2f),
        topLeft = Offset(centerX * s - 30f * s, -304f * s),
        size = Size(60f * s, 84f * s)
    )
    // Ring body: vertical gradient #FFFFFF -> #D5D7DD
    drawRoundRect(
        brush = Brush.verticalGradient(
            colors = listOf(Color(0xFFFFFFFF), Color(0xFFD5D7DD)),
            startY = -296f * s,
            endY = -212f * s
        ),
        topLeft = Offset(centerX * s - 30f * s, -296f * s),
        size = Size(60f * s, 84f * s),
        cornerRadius = CornerRadius(26f * s)
    )
    // Top ellipse (front)
    drawOval(
        color = Color.White,
        topLeft = Offset(centerX * s - 30f * s, -304f * s),
        size = Size(60f * s, 84f * s)
    )
    // Inner ellipse #E2E4E8
    drawOval(
        color = Color(0xFFE2E4E8),
        topLeft = Offset(centerX * s - 22f * s, -290f * s),
        size = Size(44f * s, 60f * s)
    )
    // Highlight rect
    drawRoundRect(
        color = Color.White.copy(alpha = 0.9f),
        topLeft = Offset(centerX * s - 10f * s, -250f * s),
        size = Size(20f * s, 20f * s),
        cornerRadius = CornerRadius(4f * s)
    )
}
