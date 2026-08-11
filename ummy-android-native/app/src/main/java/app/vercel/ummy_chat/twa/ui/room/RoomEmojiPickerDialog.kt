package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage

data class EmojiItem(
    val id: String,
    val emojiStr: String? = null,
    val bgColor: Color = Color.Transparent,
    val imageUrl: String? = null,
    val isBuiltin: Boolean = false
)

val BUILTIN_EMOJIS = listOf(
    EmojiItem("__angry__", "😠", Color(0xFFEF4444), isBuiltin = true),
    EmojiItem("__love_handshake__", "🤝", Color(0xFFFBBF24), isBuiltin = true),
    EmojiItem("__love_show__", "❤️", Color(0xFFFCE7F3), isBuiltin = true),
    EmojiItem("__thinking__", "🤔", Color(0xFFFFC107), isBuiltin = true),
    EmojiItem("__cry__", "😢", Color(0xFF64B5F6), isBuiltin = true),
    EmojiItem("__writing__", "✍️", Color(0xFFE3F2FD), isBuiltin = true),
    EmojiItem("__run__", "🏃", Color(0xFFE8F5E9), isBuiltin = true),
    EmojiItem("__frustration__", "😤", Color(0xFFFFEBEE), isBuiltin = true),
    EmojiItem("__irritation__", "😒", Color(0xFFFFF3E0), isBuiltin = true)
)

@Composable
fun RoomEmojiPickerDialog(
    visible: Boolean,
    customEmojis: List<Map<String, Any>>,
    onClose: () -> Unit,
    onSendEmoji: (String) -> Unit
) {
    if (!visible) return

    val allEmojis = remember(customEmojis) {
        val custom = customEmojis.map {
            val id = it["id"] as? String ?: Math.random().toString()
            val imageUrl = (it["imageUrl"] as? String) ?: (it["animationUrl"] as? String)
            EmojiItem(id = id, imageUrl = imageUrl, isBuiltin = false)
        }
        BUILTIN_EMOJIS + custom
    }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                ),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(16.dp, RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp), ambientColor = Color(0xFFEAB308).copy(alpha = 0.3f), spotColor = Color(0xFFEAB308).copy(alpha = 0.3f))
                    .clip(RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp))
                    .background(Color(0xFF0A0A0A).copy(alpha = 0.95f))
                    .border(1.dp, Color(0xFFEAB308).copy(alpha = 0.3f), RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp))
                    .padding(bottom = 48.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = {} // Consume click inside bottom sheet
                    )
            ) {
                // Drag handle indicator
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp, bottom = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .width(48.dp)
                            .height(6.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                    )
                }

                // Heading
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp, bottom = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "EMOJIS",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        fontStyle = FontStyle.Italic,
                        color = Color(0xFFEAB308), // text-yellow-500
                        letterSpacing = 2.sp
                    )
                }

                // Emojis Grid
                Box(modifier = Modifier.height(340.dp)) {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(allEmojis) { emoji ->
                            Box(
                                modifier = Modifier
                                    .padding(bottom = 40.dp)
                                    .fillMaxWidth(),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .then(
                                            if (emoji.isBuiltin) {
                                                Modifier
                                                    .shadow(10.dp, CircleShape)
                                                    .clip(CircleShape)
                                                    .background(emoji.bgColor)
                                            } else {
                                                Modifier
                                            }
                                        )
                                        .clickable {
                                            onSendEmoji(emoji.id)
                                            onClose()
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (emoji.imageUrl != null) {
                                        AsyncImage(
                                            model = emoji.imageUrl,
                                            contentDescription = null,
                                            contentScale = ContentScale.Inside,
                                            modifier = Modifier.fillMaxSize().padding(4.dp)
                                        )
                                    } else {
                                        Text(
                                            text = emoji.emojiStr ?: "😎",
                                            fontSize = 36.sp,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
