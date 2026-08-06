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
        // ── Host seat #1 centered — RN: <View className="items-center w-full mb-1"> ──
        val hostSeat = seats.find { it.index == 1 } ?: SeatModel(index = 1)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 4.dp),
            contentAlignment = Alignment.Center
        ) {
            SeatItem(
                seat = hostSeat,
                isMe = hostSeat.userId == currentUserId,
                onClick = { onSeatClick(hostSeat) }
            )
        }

        // ── Remaining seats — RN: flex-row flex-wrap justify-between px-2 ──
        // Each seat is width '25%' so 4 per row
        val remainingSeats = (2..maxSeats).map { idx ->
            seats.find { it.index == idx } ?: SeatModel(index = idx)
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            remainingSeats.forEach { seat ->
                SeatItem(
                    seat = seat,
                    isMe = seat.userId == currentUserId,
                    onClick = { onSeatClick(seat) }
                )
            }
        }
    }
}

@Composable
fun SeatItem(
    seat: SeatModel,
    isMe: Boolean,
    onClick: () -> Unit
) {
    val isOccupied = seat.userId != null

    // RN seat sizes:
    // Circle: width 60, height 60, borderRadius 30
    // Label: fontSize 9, fontWeight 700, marginTop 4, maxWidth 52
    // Mute badge: width 18, height 18, borderRadius 9

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(72.dp)
            .clickable { onClick() }
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(68.dp)
        ) {
            // Main seat circle — RN: 60x60, bg-sky-500/20 border-white/30 when empty
            Box(
                modifier = Modifier
                    .size(60.dp)
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
