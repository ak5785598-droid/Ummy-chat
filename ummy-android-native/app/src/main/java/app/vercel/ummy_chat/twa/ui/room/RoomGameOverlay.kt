package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectVerticalDragGestures
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage

// ─────────────────────────────────────────────────────────────────────────────
// RoomGameOverlay — mirrors RN room-game-overlay.tsx
// Game overlay container with drag-down to minimize gesture, audio mute state,
// game rules dialog, and end-of-round winner podium popup.
// ─────────────────────────────────────────────────────────────────────────────

data class GameWinner(
    val userId: String = "",
    val username: String = "",
    val avatarUrl: String? = null,
    val amount: Long = 0L,
    val rank: Int = 1
)

data class GameRoundResult(
    val resultText: String = "",
    val resultEmoji: String = "🎲",
    val myPrize: Long = 0L,
    val myWager: Long = 0L,
    val winners: List<GameWinner> = emptyList()
)

private val GAME_THEMES = mapOf(
    "fruit-party" to listOf(Color(0xFF8B5CF6), Color(0xFF6366F1)),
    "forest-party" to listOf(Color(0xFF10B981), Color(0xFF059669)),
    "roulette" to listOf(Color(0xFFEF4444), Color(0xFFB91C1C)),
    "teen-patti" to listOf(Color(0xFFF59E0B), Color(0xFFD97706)),
    "ludo" to listOf(Color(0xFF3B82F6), Color(0xFF1D4ED8)),
    "carrom" to listOf(Color(0xFFD97706), Color(0xFF78350F)),
    "chess" to listOf(Color(0xFF475569), Color(0xFF1E293B))
)

@Composable
fun RoomGameOverlay(
    visible: Boolean,
    gameId: String?,
    gameTitle: String = "Game",
    isAdmin: Boolean = false,
    roundResult: GameRoundResult? = null,
    onDismiss: () -> Unit,
    onMinimize: () -> Unit = {}
) {
    if (!visible || gameId == null) return

    var isMuted by remember { mutableStateOf(false) }
    var showRules by remember { mutableStateOf(false) }

    val themeGradient = GAME_THEMES[gameId] ?: listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.7f)),
            contentAlignment = Alignment.BottomCenter
        ) {
            // Main Overlay Sheet with Drag-Down to Minimize
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.75f)
                    .pointerInput(Unit) {
                        detectVerticalDragGestures { _, dragAmount ->
                            if (dragAmount > 80) onMinimize()
                        }
                    }
                    .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                    .background(Color(0xFF0C0C14))
                    .border(1.dp, themeGradient.first().copy(alpha = 0.3f), RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
            ) {
                // Drag Handle Bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                    )
                }

                // Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { showRules = true }, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.HelpOutline, contentDescription = "Rules", tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(18.dp))
                        }
                        Spacer(Modifier.width(4.dp))
                        Text(
                            gameTitle.uppercase(),
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { isMuted = !isMuted }, modifier = Modifier.size(32.dp)) {
                            Icon(
                                if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                                contentDescription = "Sound",
                                tint = Color.White.copy(alpha = 0.7f),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        IconButton(onClick = onMinimize, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Remove, contentDescription = "Minimize", tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(18.dp))
                        }
                        IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(18.dp))
                        }
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.05f))

                // Game Board Canvas Container
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .background(Brush.verticalGradient(themeGradient)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🎮", fontSize = 48.sp)
                        Spacer(Modifier.height(12.dp))
                        Text(
                            "$gameTitle Live Board",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            "Game in progress...",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }

                    // Round End Winner Podium Popup Overlay
                    roundResult?.let { result ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.85f))
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🏆 ROUND WINNERS", color = Color(0xFFFBBF24), fontSize = 18.sp, fontWeight = FontWeight.Black)
                                Spacer(Modifier.height(16.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly,
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    result.winners.take(3).forEach { winner ->
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            AsyncImage(
                                                model = winner.avatarUrl ?: "https://picsum.photos/200",
                                                contentDescription = winner.username,
                                                modifier = Modifier.size(48.dp).clip(CircleShape).border(2.dp, Color(0xFFFBBF24), CircleShape)
                                            )
                                            Spacer(Modifier.height(4.dp))
                                            Text(winner.username, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            Text("+🪙 ${winner.amount}", color = Color(0xFF10B981), fontSize = 10.sp, fontWeight = FontWeight.Black)
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

    // Rules Modal
    if (showRules) {
        Dialog(onDismissRequest = { showRules = false }) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF1E293B))
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("$gameTitle Rules", color = Color(0xFFFBBF24), fontSize = 16.sp, fontWeight = FontWeight.Black)
                        IconButton(onClick = { showRules = false }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    val rules = listOf(
                        "Select chip value and place your bets on the board.",
                        "Round timer runs for 25 seconds before spin.",
                        "Winnings are calculated and credited automatically."
                    )

                    LazyColumn(modifier = Modifier.height(180.dp)) {
                        items(rules) { rule ->
                            Row(modifier = Modifier.padding(vertical = 4.dp)) {
                                Text("• ", color = Color(0xFFFBBF24), fontSize = 13.sp)
                                Text(rule, color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
