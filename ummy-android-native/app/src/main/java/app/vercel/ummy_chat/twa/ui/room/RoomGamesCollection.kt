package app.vercel.ummy_chat.twa.ui.room

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// GameMiniCard — mirrors RN room-game-mini-card.tsx
// Floating action button on room screen displaying active game thumbnail
// ─────────────────────────────────────────────────────────────────────────────

private val GAME_NAMES = mapOf(
    "fruit-party" to "Fruit Party",
    "forest-party" to "Forest Party",
    "roulette" to "Roulette",
    "teen-patti" to "Teen Patti",
    "ludo" to "Ludo",
    "carrom" to "Carrom",
    "chess" to "Chess"
)

@Composable
fun GameMiniCard(
    gameId: String,
    onPress: () -> Unit,
    modifier: Modifier = Modifier
) {
    val name = GAME_NAMES[gameId] ?: "Game"

    Box(
        modifier = modifier
            .size(68.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0F172A))
            .border(1.5.dp, Color(0xFFFBBF24), RoundedCornerShape(16.dp))
            .clickable(onClick = onPress)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF8B5CF6), Color(0xFFEC4899))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Text("🎮", fontSize = 28.sp)
        }

        Text(
            name,
            color = Color.White,
            fontSize = 8.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(vertical = 2.dp)
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomGamesDialog — mirrors RN room-games-dialog.tsx
// ─────────────────────────────────────────────────────────────────────────────

data class RoomGameConfig(
    val id: String = "",
    val title: String = "",
    val coverUrl: String = "",
    val cost: Int = 0
)

private val DEFAULT_ROOM_GAMES = listOf(
    RoomGameConfig("carrom", "Carrom", "", 0),
    RoomGameConfig("ludo", "Ludo", "", 0),
    RoomGameConfig("chess", "Chess", "", 0),
    RoomGameConfig("fruit-party", "Fruit Party", "", 0),
    RoomGameConfig("forest-party", "Forest Party", "", 0),
    RoomGameConfig("roulette", "Roulette", "", 0),
    RoomGameConfig("teen-patti", "Teen Patti", "", 0)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomGamesDialog(
    visible: Boolean,
    onSelectGame: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible) return

    var games by remember { mutableStateOf(DEFAULT_ROOM_GAMES) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val db = Firebase.firestore
            val snap = db.collection("games").get().await()
            if (!snap.isEmpty) {
                games = snap.documents.map { doc ->
                    RoomGameConfig(
                        id = doc.id,
                        title = doc.getString("title") ?: doc.id.uppercase(),
                        coverUrl = doc.getString("coverUrl") ?: "",
                        cost = doc.getLong("cost")?.toInt() ?: 0
                    )
                }
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.6f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Room Games", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(Modifier.height(16.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(games, key = { it.id }) { game ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable {
                            onSelectGame(game.id, game.title)
                            onDismiss()
                        }
                    ) {
                        Box(
                            modifier = Modifier
                                .aspectRatio(1f)
                                .clip(RoundedCornerShape(18.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))),
                            contentAlignment = Alignment.Center
                        ) {
                            if (game.coverUrl.isNotBlank()) {
                                AsyncImage(
                                    model = game.coverUrl,
                                    contentDescription = game.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Text("🎯", fontSize = 32.sp)
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            game.title,
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomTasksDialog — mirrors RN room-tasks-dialog.tsx
// ─────────────────────────────────────────────────────────────────────────────

private data class RoomTaskItem(
    val id: String,
    val title: String,
    val target: Int,
    val reward: Int,
    val unit: String = ""
)

private val DAILY_ROOM_TASKS = listOf(
    RoomTaskItem("mic_10", "On mic for 10 Minutes", 10, 2500, "min"),
    RoomTaskItem("mic_30", "On mic for 30 Minutes", 30, 10000, "min"),
    RoomTaskItem("mic_60", "On mic for 60 Minutes", 60, 25000, "min"),
    RoomTaskItem("invite_1", "Invite 1 user on mic", 1, 2500),
    RoomTaskItem("invite_10", "Invite 10 users on mic", 10, 25000),
    RoomTaskItem("gift_once", "Send gift once", 1, 500)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomTasksDialog(
    visible: Boolean,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var claimedTasks by remember { mutableStateOf<Set<String>>(emptySet()) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🎯", fontSize = 20.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("ROOM DAILY TASKS", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(Modifier.height(10.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(DAILY_ROOM_TASKS, key = { it.id }) { task ->
                    val isClaimed = claimedTasks.contains(task.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(task.title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text("Reward: 🪙 ${task.reward}", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                if (!isClaimed) {
                                    claimedTasks = claimedTasks + task.id
                                    scope.launch {
                                        try {
                                            val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                            Firebase.firestore.collection("users").document(uid)
                                                .update("wallet.coins", FieldValue.increment(task.reward.toLong()))
                                                .await()
                                        } catch (_: Exception) {}
                                    }
                                }
                            },
                            enabled = !isClaimed,
                            colors = ButtonDefaults.buttonColors(containerColor = if (isClaimed) Color(0xFF10B981) else Color(0xFFF59E0B)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                if (isClaimed) "Claimed" else "Claim",
                                color = if (isClaimed) Color.White else Color.Black,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SportsHubDialog — mirrors RN sports-hub-dialog.tsx
// Live Sports scores external link launchers (Cricket, Football, Kabaddi, etc.)
// ─────────────────────────────────────────────────────────────────────────────

private data class SportLink(val name: String, val url: String, val emoji: String)

private val SPORTS_MAP = mapOf(
    "Cricket" to listOf(
        SportLink("Cricbuzz Live", "https://www.cricbuzz.com/live-cricket-scores", "🏏"),
        SportLink("ESPNcricinfo", "https://www.espncricinfo.com/live-cricket-score", "🏏")
    ),
    "Football" to listOf(
        SportLink("SofaScore", "https://www.sofascore.com/football", "⚽"),
        SportLink("ESPN Football", "https://www.espn.com/soccer/scores", "⚽")
    ),
    "Kabaddi" to listOf(
        SportLink("Pro Kabaddi", "https://www.prokabaddi.com/schedule", "🤼")
    ),
    "Basketball" to listOf(
        SportLink("NBA Scores", "https://www.nba.com/games", "🏀")
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SportsHubDialog(
    visible: Boolean,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val context = LocalContext.current
    var activeCategory by remember { mutableStateOf("Cricket") }
    val categories = remember { SPORTS_MAP.keys.toList() }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.65f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Live Sports Scores", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            // Categories pill row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSel = cat == activeCategory
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSel) Color(0xFF0284C7) else Color.White.copy(alpha = 0.08f))
                            .clickable { activeCategory = cat }
                            .padding(horizontal = 14.dp, vertical = 7.dp)
                    ) {
                        Text(cat, color = if (isSel) Color.White else Color.White.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(Modifier.height(10.dp))

            val links = SPORTS_MAP[activeCategory] ?: emptyList()
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(links) { link ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(link.emoji, fontSize = 28.sp)
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(link.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(link.url, color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp, maxLines = 1)
                        }
                        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
