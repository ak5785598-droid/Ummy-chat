package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

@Composable
fun RoomSeatMenu(
    visible: Boolean,
    onClose: () -> Unit,
    seatIndex: Int,
    isLocked: Boolean,
    isSeatMuted: Boolean,
    isOwner: Boolean,
    isModerator: Boolean,
    onTakeSeat: () -> Unit,
    onLockSeat: () -> Unit,
    onMuteSeat: () -> Unit,
    onInvite: (() -> Unit)? = null
) {
    if (!visible) return

    val canManage = isOwner || isModerator

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        // RN: TouchableOpacity backdrop (flex-1 bg-black/60)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.6f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                ),
            contentAlignment = Alignment.Center
        ) {
            // RN: View bg-white rounded-[2rem] w-full px-8
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = {} // Consume click inside dialog
                    )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(32.dp))
                        .background(Color.White)
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(32.dp))
                        .padding(24.dp)
                ) {
                    // RN: flex-row justify-between items-center
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // 1. Take mic
                        if (!isLocked || canManage) {
                            MenuItem(
                                label = "Take mic",
                                icon = Icons.Default.Mic,
                                onPress = { onTakeSeat(); onClose() }
                            )
                        } else {
                            Spacer(modifier = Modifier.width(56.dp))
                        }

                        // 2. Invite
                        if (onInvite != null) {
                            MenuItem(
                                label = "Invite",
                                icon = Icons.Default.PersonAdd,
                                onPress = { onInvite(); onClose() }
                            )
                        } else {
                            Spacer(modifier = Modifier.width(56.dp))
                        }

                        // 3. Lock/Unlock
                        if (canManage) {
                            MenuItem(
                                label = if (isLocked) "Unlock" else "Lock",
                                icon = if (isLocked) Icons.Default.LockOpen else Icons.Default.Lock,
                                iconColor = if (isLocked) Color(0xFF8B5CF6) else Color(0xFF64748B),
                                onPress = { onLockSeat(); onClose() }
                            )
                        } else {
                            Spacer(modifier = Modifier.width(56.dp))
                        }

                        // 4. Mute/Unmute
                        if (canManage) {
                            MenuItem(
                                label = if (isSeatMuted) "Unmute" else "Mute",
                                icon = if (isSeatMuted) Icons.Default.Mic else Icons.Default.MicOff,
                                iconColor = if (isSeatMuted) Color(0xFF10B981) else Color(0xFFEF4444),
                                onPress = { onMuteSeat(); onClose() }
                            )
                        } else {
                            Spacer(modifier = Modifier.width(56.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MenuItem(
    label: String,
    icon: ImageVector,
    iconColor: Color = Color(0xFF475569),
    onPress: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(56.dp)
            .clickable(onClick = onPress),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Icon circle
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Color(0xFFF8FAFC)) // bg-slate-50
                .border(1.dp, Color(0xFFF1F5F9).copy(alpha = 0.5f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconColor,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF64748B), // text-slate-500
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
