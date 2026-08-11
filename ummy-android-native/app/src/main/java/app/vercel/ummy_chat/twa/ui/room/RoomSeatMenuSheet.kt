package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSeatMenuSheet(
    seatIndex: Int,
    isLocked: Boolean,
    isMuted: Boolean,
    isInSeat: Boolean,
    canManage: Boolean,
    onDismiss: () -> Unit,
    onTakeSeat: () -> Unit,
    onInvite: () -> Unit,
    onToggleLock: () -> Unit,
    onToggleMute: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color(0xFFE2E8F0)) },
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Seat ${seatIndex}",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E293B)
            )
            
            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Take Seat
                SeatMenuOption(
                    label = "Take Seat",
                    icon = Icons.Default.EventSeat,
                    color = if (!isInSeat) Color(0xFF3B82F6) else Color(0xFF94A3B8),
                    enabled = !isInSeat,
                    onClick = {
                        onTakeSeat()
                        onDismiss()
                    }
                )

                // 2. Invite
                SeatMenuOption(
                    label = "Invite",
                    icon = Icons.Default.PersonAdd,
                    color = Color(0xFF10B981),
                    onClick = {
                        onInvite()
                        onDismiss()
                    }
                )

                // Admin Controls
                if (canManage) {
                    // 3. Lock/Unlock
                    SeatMenuOption(
                        label = if (isLocked) "Unlock" else "Lock",
                        icon = if (isLocked) Icons.Default.LockOpen else Icons.Default.Lock,
                        color = if (isLocked) Color(0xFFF59E0B) else Color(0xFFEF4444),
                        onClick = {
                            onToggleLock()
                            onDismiss()
                        }
                    )

                    // 4. Mute/Unmute
                    SeatMenuOption(
                        label = if (isMuted) "Unmute" else "Mute",
                        icon = if (isMuted) Icons.Default.Mic else Icons.Default.MicOff,
                        color = if (isMuted) Color(0xFF8B5CF6) else Color(0xFF6366F1),
                        onClick = {
                            onToggleMute()
                            onDismiss()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun SeatMenuOption(
    label: String,
    icon: ImageVector,
    color: Color,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(if (enabled) color.copy(alpha = 0.15f) else Color(0xFFF1F5F9)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (enabled) color else Color(0xFF94A3B8),
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = if (enabled) Color(0xFF475569) else Color(0xFF94A3B8)
        )
    }
}
