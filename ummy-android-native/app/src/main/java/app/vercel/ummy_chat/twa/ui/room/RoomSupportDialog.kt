package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// RoomSupportDialog — mirrors RN room-support-dialog.tsx
// Fullscreen dialog displaying Room Support program levels, partners management,
// and 17-level reward tiers table.
// ─────────────────────────────────────────────────────────────────────────────

data class SupportPartner(
    val uid: String = "",
    val name: String = "",
    val avatarUrl: String? = null
)

@Composable
fun RoomSupportDialog(
    visible: Boolean,
    roomId: String,
    isOwner: Boolean = false,
    partners: List<SupportPartner> = emptyList(),
    participants: List<SupportPartner> = emptyList(),
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var showPartnerPicker by remember { mutableStateOf(false) }
    var countdownText by remember { mutableStateOf("00h : 00m : 00s") }

    // Countdown calculation (Target: Wed 00:00 UTC)
    LaunchedEffect(Unit) {
        while (true) {
            val now = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
            val target = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
            target.set(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.WEDNESDAY)
            target.set(java.util.Calendar.HOUR_OF_DAY, 0)
            target.set(java.util.Calendar.MINUTE, 0)
            target.set(java.util.Calendar.SECOND, 0)
            if (target.before(now)) target.add(java.util.Calendar.WEEK_OF_YEAR, 1)

            val diff = target.timeInMillis - now.timeInMillis
            val hrs = diff / (1000 * 60 * 60)
            val mins = (diff % (1000 * 60 * 60)) / (1000 * 60)
            val secs = (diff % (1000 * 60)) / 1000
            countdownText = "%02dh : %02dm : %02ds".format(hrs, mins, secs)
            delay(1000)
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0A0F1D))
        ) {
            // Close Button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .padding(top = 24.dp, start = 20.dp)
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.1f))
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(18.dp))
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                item {
                    Spacer(Modifier.height(70.dp))
                    Text(
                        "ROOM SUPPORT",
                        color = Color(0xFF60A5FA),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                    Text(
                        "WEEKLY TARGETS & REWARDS PROGRAM",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(Modifier.height(24.dp))
                }

                // Partners Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF161F33))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Room Partners (Max 3)", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF3B82F6).copy(alpha = 0.2f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(countdownText, color = Color(0xFF60A5FA), fontSize = 10.sp, fontWeight = FontWeight.Black)
                                }
                            }

                            Spacer(Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                for (i in 0..2) {
                                    val partner = partners.getOrNull(i)
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier.clickable(enabled = isOwner) {
                                            if (partner != null) {
                                                // Remove partner
                                                scope.launch {
                                                    try {
                                                        Firebase.firestore.collection("chatRooms").document(roomId)
                                                            .update("partners", FieldValue.arrayRemove(partner))
                                                            .await()
                                                    } catch (_: Exception) {}
                                                }
                                            } else {
                                                showPartnerPicker = true
                                            }
                                        }
                                    ) {
                                        if (partner != null) {
                                            AsyncImage(
                                                model = partner.avatarUrl ?: "https://picsum.photos/200",
                                                contentDescription = partner.name,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.size(52.dp).clip(CircleShape).border(2.dp, Color(0xFF38BDF8), CircleShape)
                                            )
                                            Spacer(Modifier.height(4.dp))
                                            Text(partner.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                        } else {
                                            Box(
                                                modifier = Modifier
                                                    .size(52.dp)
                                                    .clip(CircleShape)
                                                    .background(Color.White.copy(alpha = 0.05f))
                                                    .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = "Add Partner", tint = Color.White.copy(alpha = 0.5f))
                                            }
                                            Spacer(Modifier.height(4.dp))
                                            Text("Empty", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))
                }

                // Reward Tiers Table Header
                item {
                    Text(
                        "REWARD TIERS TABLE",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Start
                    )
                    Spacer(Modifier.height(10.dp))
                }

                // Tier Table Rows
                val tiers = (1..17).reversed().toList()
                items(tiers) { lvl ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFF161F33))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Lvl $lvl", color = Color(0xFFFBBF24), fontSize = 13.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(50.dp))
                        Text("Coins Target: ${lvl * 50_000}", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                        Text("Reward: ${lvl * 5_000} 🪙", color = Color(0xFF10B981), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                item {
                    Spacer(Modifier.height(40.dp))
                }
            }
        }
    }

    // Partner Selection Dialog Modal
    if (showPartnerPicker) {
        Dialog(onDismissRequest = { showPartnerPicker = false }) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF0F172A))
                    .padding(20.dp)
            ) {
                Column {
                    Text("Select Partner", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    LazyColumn(modifier = Modifier.height(250.dp)) {
                        items(participants) { part ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        scope.launch {
                                            try {
                                                Firebase.firestore.collection("chatRooms").document(roomId)
                                                    .update("partners", FieldValue.arrayUnion(part))
                                                    .await()
                                            } catch (_: Exception) {}
                                        }
                                        showPartnerPicker = false
                                    }
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = part.avatarUrl ?: "https://picsum.photos/200",
                                    contentDescription = part.name,
                                    modifier = Modifier.size(36.dp).clip(CircleShape)
                                )
                                Spacer(Modifier.width(12.dp))
                                Text(part.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
