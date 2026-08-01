package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.repository.LiveRoomModel
import coil.compose.AsyncImage

@Composable
fun RowScope.ChatRoomCard(
    room: LiveRoomModel,
    onPress: () -> Unit,
    modifier: Modifier = Modifier
) {
    val liveCount = maxOf(0, room.participantCount)
    val roomTitle = room.title.takeIf { it.isNotBlank() } ?: "Frequency"
    val ownerName = room.ownerName.takeIf { it.isNotBlank() } ?: "Tribe Member"
    val roomNumber = room.roomNumber.takeIf { it.isNotBlank() } ?: "0000"
    
    val ownerAvatar: String? = null // Handled with fallback if null

    Box(
        modifier = modifier
            .weight(1f)
            .padding(horizontal = 4.dp)
            .padding(bottom = 12.dp)
            .height(150.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF8F9FE))
            .clickable(onClick = onPress)
    ) {
        if (!room.coverUrl.isNullOrEmpty()) {
            AsyncImage(
                model = room.coverUrl,
                contentDescription = "Room Cover",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFF8B5CF6).copy(alpha = 0.15f),
                                Color(0xFF8B5CF6).copy(alpha = 0.05f)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🏠",
                    fontSize = 30.sp,
                    color = Color(0xFF8B5CF6).copy(alpha = 0.3f)
                )
            }
        }

        // Cinematic Gradients for Text Legibility
        // Top Gradient
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .align(Alignment.TopCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0x80000000), // rgba(0,0,0,0.5)
                            Color(0x1A000000), // rgba(0,0,0,0.1)
                            Color.Transparent
                        )
                    )
                )
        )
        
        // Bottom Gradient
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color(0x66000000), // rgba(0,0,0,0.4)
                            Color(0xCC000000)  // rgba(0,0,0,0.8)
                        )
                    )
                )
        )

        // Top Left: ID Tag
        Box(
            modifier = Modifier
                .padding(8.dp)
                .align(Alignment.TopStart)
                .background(Color(0x66000000), CircleShape) // bg-black/40
                .border(1.dp, Color(0x1AFFFFFF), CircleShape) // border-white/10
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(
                text = "ID:$roomNumber",
                fontSize = 7.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )
        }

        // Top Right: Live Viewers
        Row(
            modifier = Modifier
                .padding(8.dp)
                .align(Alignment.TopEnd)
                .background(Color(0x66000000), CircleShape)
                .border(1.dp, Color(0x1AFFFFFF), CircleShape)
                .padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .background(
                        color = if (liveCount > 0) Color(0xFF00E5FF) else Color(0xFF94A3B8), // cyan #00E5FF or slate-400
                        shape = CircleShape
                    )
            )
            Text(
                text = liveCount.toString(),
                fontSize = 7.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )
        }

        // Bottom Content: Title & Host
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = roomTitle,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (ownerAvatar != null) {
                    AsyncImage(
                        model = ownerAvatar,
                        contentDescription = "Host Avatar",
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .border(1.dp, Color(0x4DFFFFFF), CircleShape), // border-white/30
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .background(Color(0xFF1E293B), CircleShape) // bg-slate-800
                            .border(1.dp, Color(0x4DFFFFFF), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = ownerName.take(1).uppercase(),
                            fontSize = 5.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                Text(
                    text = ownerName.uppercase(),
                    fontSize = 7.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.8f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = 1.sp,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}
