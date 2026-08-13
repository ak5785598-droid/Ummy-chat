package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

/**
 * Bubble Config defining colors, border, tail, and decorators.
 */
data class BubbleStyleConfig(
    val colors: List<Color>,
    val borderColor: Color,
    val tailColor: Color,
    val decorator: String? = null,
    val borderWidth: Float = 1.5f,
    val borderStyle: String = "solid",
    val animation: String? = null
)

val BUBBLE_CONFIGS = mapOf(
    "heart-bubble" to BubbleStyleConfig(
        colors = listOf(Color(0xFFF472B6), Color(0xFFDB2777), Color(0xFFBE185D)),
        borderColor = Color(0x73FFFFFF), // rgba(255,255,255,0.45)
        tailColor = Color(0xFFDB2777),
        decorator = "💖",
        borderWidth = 1.5f,
        borderStyle = "solid",
        animation = "roses"
    )
    // Next bubbles will be added here one by one as requested.
)

/**
 * A custom Shape that draws a rounded rectangle with a chat tail on the left or right.
 */
class ChatBubbleShape(private val isMe: Boolean) : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: androidx.compose.ui.unit.LayoutDirection,
        density: androidx.compose.ui.unit.Density
    ): Outline {
        val cornerRadius = 16.dp.value * density.density
        val tailWidth = 8.dp.value * density.density
        val tailHeight = 8.dp.value * density.density

        val path = Path().apply {
            if (isMe) {
                // Tail on bottom right
                addRoundRect(
                    androidx.compose.ui.geometry.RoundRect(
                        left = 0f,
                        top = 0f,
                        right = size.width - tailWidth,
                        bottom = size.height,
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(cornerRadius, cornerRadius)
                    )
                )
                // Draw tail
                moveTo(size.width - tailWidth, size.height - tailHeight - cornerRadius)
                lineTo(size.width, size.height)
                lineTo(size.width - tailWidth, size.height - cornerRadius)
                close()
            } else {
                // Tail on bottom left
                addRoundRect(
                    androidx.compose.ui.geometry.RoundRect(
                        left = tailWidth,
                        top = 0f,
                        right = size.width,
                        bottom = size.height,
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(cornerRadius, cornerRadius)
                    )
                )
                // Draw tail
                moveTo(tailWidth, size.height - tailHeight - cornerRadius)
                lineTo(0f, size.height)
                lineTo(tailWidth, size.height - cornerRadius)
                close()
            }
        }
        return Outline.Generic(path)
    }
}

@Composable
fun ChatMessageBubble(
    bubbleId: String?,
    bubbleMediaUrl: String?,
    isMe: Boolean,
    showTail: Boolean = true,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    // 1. Handle Dynamic Media Bubble (Store purchases like MP4/Image)
    if (!bubbleMediaUrl.isNullOrEmpty() && bubbleMediaUrl.startsWith("http")) {
        // For now using Coil for all URLs. If it's an mp4 we'll add ExoPlayer later.
        Box(
            modifier = modifier
                .padding(bottom = 4.dp)
                .fillMaxWidth(0.85f)
                .wrapContentWidth(if (isMe) Alignment.End else Alignment.Start)
        ) {
            AsyncImage(
                model = bubbleMediaUrl,
                contentDescription = null,
                contentScale = ContentScale.FillBounds,
                modifier = Modifier
                    .matchParentSize()
                    .graphicsLayer {
                        shape = ChatBubbleShape(isMe)
                        clip = true
                    }
            )
            Box(
                modifier = Modifier
                    .padding(horizontal = if (isMe) 12.dp else (12.dp + 8.dp), vertical = 12.dp)
            ) {
                content()
            }
        }
        return
    }

    // 2. Handle Plain Message (No Bubble)
    if (bubbleId.isNullOrEmpty() || bubbleId == "None") {
        Box(
            modifier = modifier
                .padding(bottom = 8.dp)
                .fillMaxWidth(0.85f)
                .wrapContentWidth(if (isMe) Alignment.End else Alignment.Start)
                .background(
                    color = if (isMe) Color(0xCC150029) else Color(0x66000000),
                    shape = RoundedCornerShape(16.dp)
                )
                .border(
                    width = 1.dp,
                    color = if (isMe) Color(0x4DA855F7) else Color(0x1AFFFFFF),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            content()
        }
        return
    }

    // 3. Handle Hardcoded Premium Bubbles (e.g. heart-bubble)
    val config = BUBBLE_CONFIGS[bubbleId] ?: BUBBLE_CONFIGS["heart-bubble"]!!
    val gradientBrush = Brush.linearGradient(
        colors = config.colors,
        start = Offset(0f, 0f),
        end = Offset(Float.POSITIVE_INFINITY, 0f)
    )

    // Animations setup
    val infiniteTransition = rememberInfiniteTransition()
    val floatAnim by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -12f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FloatAnim"
    )

    Box(
        modifier = modifier
            .padding(bottom = 8.dp)
            .fillMaxWidth(1f)
            .wrapContentWidth(if (isMe) Alignment.End else Alignment.Start)
    ) {
        Box(
            modifier = Modifier
                .defaultMinSize(minWidth = 60.dp)
                .graphicsLayer {
                    shape = ChatBubbleShape(isMe)
                    clip = true
                    shadowElevation = 8.dp.toPx()
                    ambientShadowColor = config.tailColor
                    spotShadowColor = config.tailColor
                }
                .background(gradientBrush)
                .drawBehind {
                    // Draw Border
                    drawPath(
                        path = Path().apply {
                            addOutline(ChatBubbleShape(isMe).createOutline(size, layoutDirection, this@drawBehind))
                        },
                        color = config.borderColor,
                        style = Stroke(width = config.borderWidth * density)
                    )
                    
                    // Glossy top-highlight
                    drawRoundRect(
                        color = Color(0x38FFFFFF),
                        topLeft = Offset(16f, 2f),
                        size = Size(size.width - 32f, 8f),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(4f, 4f)
                    )
                }
                .padding(
                    start = if (!isMe) 20.dp else 12.dp,
                    end = if (isMe) 20.dp else 12.dp,
                    top = 8.dp,
                    bottom = 8.dp
                )
        ) {
            content()
        }

        // Decorator
        if (config.decorator != null) {
            Text(
                text = config.decorator,
                fontSize = 11.sp,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 9.dp, y = floatAnim.dp)
            )
        }
    }
}
