package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.SeatModel
import coil.compose.AsyncImage

@Composable
fun RoomSeatGrid(
    seats: List<SeatModel>,
    maxSeats: Int,
    currentUserId: String,
    canManage: Boolean,
    onSeatClick: (SeatModel) -> Unit
) {
    // RN L1806-1813: <View className="px-2"> ... seat(1) centered ... flex-row flex-wrap justify-between px-2
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp)
    ) {
        val hasTopHostSeat = maxSeats != 8
        val seatsPerRow = if (maxSeats in listOf(6, 11, 16)) 5 else 4
        val seatSize = when (maxSeats) {
            16 -> 48.dp
            13 -> 50.dp
            else -> 60.dp
        }
        val boxSize = seatSize + 8.dp

        if (hasTopHostSeat) {
            // ── Host seat #1 centered ──
            val hostSeat = seats.find { it.index == 1 } ?: SeatModel(index = 1)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 2.dp),
                contentAlignment = Alignment.Center
            ) {
                SeatItem(
                    seat = hostSeat,
                    isMe = hostSeat.userId == currentUserId,
                    seatSize = seatSize,
                    boxSize = boxSize,
                    onClick = { onSeatClick(hostSeat) }
                )
            }
        }

        // ── Remaining seats ──
        val startingIndex = if (hasTopHostSeat) 2 else 1
        val gridSeats = (startingIndex..maxSeats).map { idx ->
            seats.find { it.index == idx } ?: SeatModel(index = idx)
        }

        gridSeats.chunked(seatsPerRow).forEach { rowSeats ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                rowSeats.forEach { seat ->
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        SeatItem(
                            seat = seat,
                            isMe = seat.userId == currentUserId,
                            seatSize = seatSize,
                            boxSize = boxSize,
                            onClick = { onSeatClick(seat) }
                        )
                    }
                }
                // Fill empty slots in last row so SpaceBetween stays consistent
                repeat(seatsPerRow - rowSeats.size) {
                    Box(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun SeatItem(
    seat: SeatModel,
    isMe: Boolean,
    seatSize: Dp = 60.dp,
    boxSize: Dp = 68.dp,
    onClick: () -> Unit
) {
    val isOccupied = seat.userId != null

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { onClick() }
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(boxSize)
        ) {
            // Main seat circle
            Box(
                modifier = Modifier
                    .size(seatSize)
                    .clip(CircleShape)
                    .then(
                        if (isOccupied && seat.isSpeaking)
                            Modifier.border(2.dp, Color(0xFF22C55E), CircleShape)
                        else if (seat.isLocked)
                            Modifier.border(2.dp, Color(0xFFEF4444).copy(alpha = 0.75f), CircleShape)
                        else if (isOccupied)
                            Modifier.border(1.dp, Color.White.copy(alpha = 0.45f), CircleShape)
                        else
                            Modifier.border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape)
                    )
                    .then(
                        if (isOccupied) Modifier.background(Color.Black.copy(alpha = 0.3f))
                        else Modifier.background(Color(0x330EA5EC)) // sky-500/20
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isOccupied) {
                    // Avatar — RN: w-full h-full
                    AsyncImage(
                        model = seat.avatarUrl ?: "https://picsum.photos/100",
                        contentDescription = seat.username,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                    )
                } else if (seat.isLocked) {
                    // RN: Lock size=18 color=rgba(239,68,68,0.7)
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = "Locked",
                        tint = Color(0xFFEF4444).copy(alpha = 0.7f),
                        modifier = Modifier.size(18.dp)
                    )
                } else {
                    // RN: Armchair size=22 color=rgba(255,255,255,0.85)
                    Icon(
                        Icons.Default.Chair,
                        contentDescription = "Empty seat",
                        tint = Color.White.copy(alpha = 0.85f),
                        modifier = Modifier.size(22.dp)
                    )
                }
            }

            // Mute badge — RN: absolute bottom:0 right:-2, w:18 h:18, bg #ef4444, border 1.5 #000
            if (seat.isMuted && isOccupied) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = 2.dp, y = 2.dp)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFEF4444))
                        .border(1.5.dp, Color.Black, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.MicOff,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(10.dp)
                    )
                }
            }
            
            // Emoji reaction overlay
            if (seat.activeEmoji != null) {
                EmojiReactionOverlay(
                    emoji = seat.activeEmoji,
                    visible = true,
                    size = 32
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Label — RN: fontSize:9 fontWeight:700 textTransform:uppercase letterSpacing:0.5 maxWidth:52
        Text(
            text = if (isOccupied) {
                (seat.username ?: "NO.${seat.index}").uppercase()
            } else "NO.${seat.index}",
            color = if (isOccupied) Color.White.copy(alpha = 0.8f)
                    else Color.White.copy(alpha = 0.5f),
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = 52.dp)
        )
    }
}
