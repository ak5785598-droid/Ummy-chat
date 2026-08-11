package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlin.random.Random
import app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon

// ─────────────────────────────────────────────────────────────────────────────
// LootGate — mirrors RN loot-gate.tsx
// Interactive Loot Bag popup on seat/room when a user drops a loot box
// ─────────────────────────────────────────────────────────────────────────────

data class LootBoxData(
    val id: String = "",
    val senderName: String = "",
    val totalCoins: Long = 0L,
    val remainingCoins: Long = 0L,
    val maxClaims: Int = 10,
    val claimCount: Int = 0
)

@Composable
fun LootGate(
    visible: Boolean,
    lootBox: LootBoxData?,
    onClaim: (Long) -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible || lootBox == null) return

    val scope = rememberCoroutineScope()
    var isClaiming by remember { mutableStateOf(false) }
    var claimedAmount by remember { mutableStateOf<Long?>(null) }

    val pulse by rememberInfiniteTransition(label = "loot_pulse").animateFloat(
        initialValue = 1f, targetValue = 1.12f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse),
        label = "pulse"
    )

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.7f)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF0F172A))
                    .border(2.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End).size(28.dp)
                ) {
                    Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                }

                Text("🎁 LUCKY LOOT BAG", color = Color(0xFFFBBF24), fontSize = 18.sp, fontWeight = FontWeight.Black)
                Text("Dropped by ${lootBox.senderName}", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)

                Spacer(Modifier.height(20.dp))

                Box(
                    modifier = Modifier
                        .scale(pulse)
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFBBF24).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    GoldDollarIcon(size = 48)
                }

                Spacer(Modifier.height(16.dp))

                if (claimedAmount != null) {
                    Text(
                        "+$claimedAmount COINS!",
                        color = Color(0xFF10B981),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black
                    )
                } else {
                    Text(
                        "${lootBox.claimCount}/${lootBox.maxClaims} Claimed",
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 11.sp
                    )
                }

                Spacer(Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (isClaiming || claimedAmount != null) return@Button
                        isClaiming = true
                        scope.launch {
                            val coinsWon = (Random.nextInt(10, 500)).toLong()
                            claimedAmount = coinsWon
                            onClaim(coinsWon)
                            delay(1500)
                            onDismiss()
                        }
                    },
                    enabled = !isClaiming && claimedAmount == null,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isClaiming) {
                        CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(20.dp))
                    } else {
                        Text(
                            if (claimedAmount != null) "Claimed 🎉" else "GRAB LOOT 💰",
                            color = Color.Black,
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LootingRoom — mirrors RN looting-room.tsx
// Active room looting banner summary
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun LootingRoomBanner(
    visible: Boolean,
    activeLootCount: Int = 0,
    onOpenLoot: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!visible || activeLootCount <= 0) return

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(99.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFFF59E0B), Color(0xFFD97706))
                )
            )
            .clickable(onClick = onOpenLoot)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        GoldDollarIcon(size = 14)
        Spacer(Modifier.width(6.dp))
        Text(
            "$activeLootCount LOOT BAGS ACTIVE",
            color = Color.Black,
            fontSize = 10.sp,
            fontWeight = FontWeight.Black
        )
    }
}
