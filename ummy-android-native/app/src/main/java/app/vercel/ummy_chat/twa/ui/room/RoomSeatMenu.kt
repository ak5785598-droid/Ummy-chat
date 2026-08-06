package app.vercel.ummy_chat.twa.ui.room

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.data.model.SeatModel
import coil.compose.AsyncImage

// ─────────────────────────────────────────────────────────────────────────────
// SeatActionMenu — shown on tap of any seat
// Empty seat  → Take Seat / Lock / Invite User
// My seat     → Leave Seat / Mute
// Others seat → (owner/mod) Lock/Mute/Kick / (any) View Profile / Send Gift / Invite
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun SeatActionMenu(
    seat: SeatModel,
    currentUserId: String,
    isOwnerOrMod: Boolean,
    onDismiss: () -> Unit,
    onTakeSeat: () -> Unit,
    onLeaveSeat: () -> Unit,
    onLockSeat: () -> Unit,
    onMuteSeat: () -> Unit,
    onKickUser: () -> Unit,
    onViewProfile: () -> Unit,
    onSendGift: () -> Unit,
    onSendMicInvite: () -> Unit
) {
    val isOccupied = seat.userId != null
    val isMyself = seat.userId == currentUserId
    val isLocked = seat.isLocked

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF1E1B4B))
                    .padding(20.dp)
            ) {
                // ── Seat header ──
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF312E81)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isOccupied) {
                            AsyncImage(
                                model = seat.avatarUrl ?: "https://picsum.photos/seed/${seat.userId}/60",
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize().clip(CircleShape)
                            )
                        } else {
                            Text(
                                if (isLocked) "🔒" else "🎤",
                                fontSize = 22.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = when {
                                isOccupied -> seat.username ?: "User"
                                isLocked   -> "Seat #${seat.index} (Locked)"
                                else       -> "Seat #${seat.index} (Empty)"
                            },
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        if (seat.isMuted && isOccupied) {
                            Text("🔇 Muted", color = Color(0xFFEF4444), fontSize = 11.sp)
                        } else if (seat.isSpeaking) {
                            Text("🟢 Speaking", color = Color(0xFF10B981), fontSize = 11.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(14.dp))

                // ── Actions ──
                if (isOccupied) {
                    if (isMyself) {
                        // My own seat
                        SeatMenuBtn(
                            icon = "🚪", label = "Leave Seat",
                            color = Color(0xFFEF4444),
                            onClick = { onLeaveSeat(); onDismiss() }
                        )
                    } else {
                        // Viewing someone else's seat
                        SeatMenuBtn("👤", "View Profile", Color(0xFF6366F1)) { onViewProfile(); onDismiss() }
                        SeatMenuBtn("🎁", "Send Gift", Color(0xFFEC4899)) { onSendGift(); onDismiss() }
                        SeatMenuBtn("🎙️", "Send Mic Invite", Color(0xFF06B6D4)) { onSendMicInvite(); onDismiss() }

                        if (isOwnerOrMod) {
                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                            Spacer(modifier = Modifier.height(8.dp))
                            SeatMenuBtn(
                                icon = if (seat.isMuted) "🎤" else "🔇",
                                label = if (seat.isMuted) "Unmute Seat" else "Mute Seat",
                                color = Color(0xFFF59E0B),
                                onClick = { onMuteSeat(); onDismiss() }
                            )
                            SeatMenuBtn("👟", "Kick User", Color(0xFFEF4444)) { onKickUser(); onDismiss() }
                        }
                    }
                } else {
                    // Empty seat
                    if (!isLocked) {
                        SeatMenuBtn("🎤", "Take Seat", Color(0xFF22C55E)) { onTakeSeat(); onDismiss() }
                        SeatMenuBtn("📨", "Invite User to Mic", Color(0xFF06B6D4)) { onSendMicInvite(); onDismiss() }
                    }
                    if (isOwnerOrMod) {
                        SeatMenuBtn(
                            icon = if (isLocked) "🔓" else "🔒",
                            label = if (isLocked) "Unlock Seat" else "Lock Seat",
                            color = Color(0xFFF59E0B),
                            onClick = { onLockSeat(); onDismiss() }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
                ) {
                    Text("Cancel", color = Color.White.copy(alpha = 0.7f))
                }
            }
        }
    }
}

@Composable
fun SeatMenuBtn(
    icon: String, label: String, color: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.12f))
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(icon, fontSize = 18.sp)
        Spacer(modifier = Modifier.width(12.dp))
        Text(label, color = color, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
    Spacer(modifier = Modifier.height(8.dp))
}
